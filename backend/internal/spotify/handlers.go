package spotify

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

func RefreshSpotifyToken(refreshToken string) (SpotifyToken, error) {
	clientID := os.Getenv("SPOTIFY_CLIENT_ID")
	clientSecret := os.Getenv("SPOTIFY_CLIENT_SECRET")

	if clientID == "" || clientSecret == "" {
		return SpotifyToken{}, errors.New("missing Spotify client credentials")
	}

	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", refreshToken)

	req, err := http.NewRequest("POST", "https://accounts.spotify.com/api/token", bytes.NewBufferString(data.Encode()))
	if err != nil {
		return SpotifyToken{}, err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(clientID, clientSecret)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return SpotifyToken{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return SpotifyToken{}, fmt.Errorf("Spotify token refresh failed: %s", resp.Status)
	}

	var tokenResp SpotifyTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return SpotifyToken{}, err
	}

	// Calculate the new expiry time
	expiry := time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)

	// Build response struct
	result := SpotifyToken{
		AccessToken: tokenResp.AccessToken,
		ExpiresAt:   expiry,
	}

	// Spotify may or may not return a refresh token
	if tokenResp.RefreshToken != "" {
		result.RefreshToken = tokenResp.RefreshToken
	}

	return result, nil
}

func GetAllPlaylists(accessToken string) ([]SpotifyPlaylist, error) {
	var allPlaylists []SpotifyPlaylist
	url := "https://api.spotify.com/v1/me/playlists?limit=50"

	for url != "" {
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, err
		}

		req.Header.Set("Authorization", "Bearer "+accessToken)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("Spotify API error: %s", resp.Status)
		}

		var page SpotifyPlaylistPage
		if err := json.NewDecoder(resp.Body).Decode(&page); err != nil {
			return nil, err
		}

		allPlaylists = append(allPlaylists, page.Items...)
		url = page.Next // Spotify gives you the next page URL
	}

	return allPlaylists, nil
}

func GetTracksFromPlaylist(accessToken string, playlistID string) ([]SpotifyTrack, error) {
    var tracks []SpotifyTrack
    url := fmt.Sprintf("https://api.spotify.com/v1/playlists/%s/tracks?limit=100", playlistID)

    for url != "" {
        req, err := http.NewRequest("GET", url, nil)
        if err != nil {
            return nil, err
        }

        req.Header.Set("Authorization", "Bearer "+accessToken)

        resp, err := http.DefaultClient.Do(req)
        if err != nil {
            return nil, err
        }

		if resp.StatusCode == 429 {
			retryAfter, _ := strconv.Atoi(resp.Header.Get("Retry-After"))
			resp.Body.Close()
			time.Sleep(time.Duration(retryAfter+1) * time.Second)
			continue
		}

        if resp.StatusCode != http.StatusOK {
            resp.Body.Close()
            return nil, fmt.Errorf("Spotify API error: %s", resp.Status)
        }

        var result SpotifyTrackPage
        if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
            resp.Body.Close()
            return nil, err
        }
        resp.Body.Close()

        for _, item := range result.Items {
            if item.Track.ID == "" {
                continue
            }

            tracks = append(tracks, SpotifyTrack{
                ID:      item.Track.ID,
                Name:    item.Track.Name,
                Artists: item.Track.Artists,
            })
        }

        url = result.Next
    }

    return tracks, nil
}

func CopyPlaylistToLiked(accessToken string, playlistID string) error {
	tracks, err := GetTracksFromPlaylist(accessToken, playlistID)
	if err != nil {
        return err
    }

	trackIds := extractTrackIDs(tracks)

	batchSize := 50
	chunks := batchTrackIDs(trackIds, batchSize)

	for _, batch := range chunks {
		url := "https://api.spotify.com/v1/me/tracks?ids=" + strings.Join(batch, ",")
		
		req, err := http.NewRequest("PUT", url, nil)
		if err != nil { return err }
		req.Header.Set("Authorization", "Bearer "+accessToken)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode == 429 {
            retryAfter, _ := strconv.Atoi(resp.Header.Get("Retry-After"))
            time.Sleep(time.Duration(retryAfter+1) * time.Second)
            continue
        }

        if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
            body, _ := io.ReadAll(resp.Body)
            return fmt.Errorf("Spotify save tracks failed: %s", string(body))
        }
	}
	
	return nil
}

func GetSavedSongs(accessToken string) ([]SpotifyTrack, error) {
    var allTracks []SpotifyTrack
    url := "https://api.spotify.com/v1/me/tracks?limit=50"

    for url != "" {
        req, err := http.NewRequest("GET", url, nil)
        if err != nil {
            return nil, err
        }

        req.Header.Set("Authorization", "Bearer "+accessToken)

        resp, err := http.DefaultClient.Do(req)
        if err != nil {
            return nil, err
        }

        if resp.StatusCode == 429 {
            retryAfter, _ := strconv.Atoi(resp.Header.Get("Retry-After"))
            resp.Body.Close()
            time.Sleep(time.Duration(retryAfter+1) * time.Second)
            continue
        }

        if resp.StatusCode != http.StatusOK {
            body, _ := io.ReadAll(resp.Body)
            resp.Body.Close()
            return nil, fmt.Errorf("Spotify API error: %s - %s", resp.Status, string(body))
        }

        var page SpotifyTrackPage
        if err := json.NewDecoder(resp.Body).Decode(&page); err != nil {
            resp.Body.Close()
            return nil, err
        }
        resp.Body.Close()

        for _, item := range page.Items {
            allTracks = append(allTracks, item.Track)
        }

        url = page.Next
    }

    return allTracks, nil
}