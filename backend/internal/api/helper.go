package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"

	"github.com/blobthebuilder/easysongs/internal/spotify"
)

type RemoveDuplicatesPlaylistRequest struct{
	SnapshotID string `json:"snapshotId"`
	PrioNonexplicit *bool `json:"prioNonexplicit,omitempty"`
	AlbumTypePriority []string `json:"albumTypePriority"`
}

type ProcessedTrack struct {
	Name          string
	Artists string
}

type TrackMeta struct{
	URI string
	Explicit bool
	AlbumType string
}

type CopyTracksRequest struct {
	TrackIDs []string `json:"track_ids"`
}


func normalizeTrackName(trackName string) string {
	trackName = strings.ToLower(trackName)
	trackName = strings.TrimSpace(trackName)

	return  trackName
}

func normalizeArtists(artists []spotify.Artist) string{
	names := make([]string, 0, len(artists))
    for _, a := range artists {
        names = append(names, a.Name)
    }
    sort.Strings(names)
    return strings.Join(names, ",")
}

func albumTypePriorityMap(p []string) map[string]int {
    prio := make(map[string]int, len(p))
    for i, t := range p {
        prio[t] = i // lower index = higher priority
    }
    return prio
}

func shouldReplaceByAlbumType(
    existing TrackMeta,
    candidate TrackMeta,
    albumPrio map[string]int,
) bool {
    return albumPrio[candidate.AlbumType] < albumPrio[existing.AlbumType]
}


// Helper function to keep the loop clean
func sendAddTracksRequest(playlistID string, uris []string, token string) error {
	url := fmt.Sprintf("https://api.spotify.com/v1/playlists/%s/tracks", playlistID)
	
	body, _ := json.Marshal(map[string][]string{"uris": uris})
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("spotify API returned status %d", resp.StatusCode)
	}
	return nil
}