package spotify

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"
)

type SpotifyTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn   int    `json:"expires_in"`
}

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

type SpotifyPlaylist struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type SpotifyPlaylistPage struct {
	Items []SpotifyPlaylist `json:"items"`
	Next  string            `json:"next"`
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

type SpotifyTrack struct {
    ID     string `json:"id"`
    Name   string `json:"name"`
    Artist string `json:"artist"`
}

func GetTracks(accessToken, playlistID string) ([]SpotifyTrack, error) {
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
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
            return nil, fmt.Errorf("Spotify API error: %s", resp.Status)
        }

        var result struct {
            Items []struct {
                Track struct {
                    ID     string `json:"id"`
                    Name   string `json:"name"`
                    Artists []struct {
                        Name string `json:"name"`
                    } `json:"artists"`
                } `json:"track"`
            } `json:"items"`
            Next string `json:"next"`
        }

        if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
            return nil, err
        }

        for _, item := range result.Items {
            if item.Track.ID == "" {
                continue
            }

            artist := ""
            if len(item.Track.Artists) > 0 {
                artist = item.Track.Artists[0].Name
            }

            tracks = append(tracks, SpotifyTrack{
                ID:     item.Track.ID,
                Name:   item.Track.Name,
                Artist: artist,
            })
        }

        url = result.Next
    }

    return tracks, nil
}
