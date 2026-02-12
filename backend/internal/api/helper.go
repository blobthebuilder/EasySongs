package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"

	"github.com/blobthebuilder/easysongs/internal/db"
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

type TagBatchRequest struct {
    TagName  string   `json:"tagName"`
    TrackIDs []string `json:"trackIDs"`
    TagColor string `json:"color"`
}

type PlaylistDetailsResponse struct {
    Name   string               `json:"name"`
    Images []spotify.ImageObject `json:"images"`
    Tracks []spotify.SpotifyTrack      `json:"tracks"` 
	Tags map[string][]db.TagInfo  `json:"tags"`
}

type LikedSongsDetailsResponse struct {
    Tracks []spotify.SpotifyTrack `json:"tracks"` 
    Tags map[string][]db.TagInfo  `json:"tags"`
}

type RemoveTagsRequest struct {
	TrackIDs []string `json:"trackIds"`
	TagIDs   []int `json:"tagIds"` // If empty, it means "Remove All"
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


func executeSpotifyRequest(method, url string, body []byte, token string) error {
    req, _ := http.NewRequest(method, url, bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        return fmt.Errorf("spotify returned status %d", resp.StatusCode)
    }
    return nil
}

func calculateDiff(oldTracks, newTracks []string) db.PlaylistDiff {
	oldMap := make(map[string]bool)
	newMap := make(map[string]bool)
	diff := db.PlaylistDiff{
		Added:   []string{},
		Removed: []string{},
	}

	for _, id := range oldTracks {
		oldMap[id] = true
	}
	for _, id := range newTracks {
		newMap[id] = true
	}

	// Added: Exists in new, but not in old
	for _, id := range newTracks {
		if !oldMap[id] {
			diff.Added = append(diff.Added, id)
		}
	}

	// Removed: Exists in old, but not in new
	for _, id := range oldTracks {
		if !newMap[id] {
			diff.Removed = append(diff.Removed, id)
		}
	}

	return diff
}

func reconstructPlaylist(history []db.Snapshot) []string {
	if len(history) == 0 {
		return []string{}
	}

	// 1. Find the most recent 'full' snapshot (the anchor)
	var currentTracks []string
	anchorIndex := -1

	// History is ordered newest to oldest, so we find the first 'full' one
	for i, snap := range history {
		if snap.Type == db.SnapshotFull {
			json.Unmarshal(snap.SnapshotData, &currentTracks)
			anchorIndex = i
			break
		}
	}

	// If no full snapshot found (shouldn't happen with proper indexing), return empty
	if anchorIndex == -1 {
		return []string{}
	}

	// 2. Apply all 'diffs' that happened AFTER that anchor
	// Since history is [newest...anchor...oldest], we iterate BACKWARDS from the anchor
	for i := anchorIndex - 1; i >= 0; i-- {
		var diff db.PlaylistDiff
		json.Unmarshal(history[i].SnapshotData, &diff)

		// Apply Removals first
		if len(diff.Removed) > 0 {
			currentTracks = filterRemoved(currentTracks, diff.Removed)
		}

		// Apply Additions
		currentTracks = append(currentTracks, diff.Added...)
	}

	return currentTracks
}

// Helper to filter out removed tracks
func filterRemoved(tracks []string, toRemove []string) []string {
	removeMap := make(map[string]bool)
	for _, id := range toRemove {
		removeMap[id] = true
	}

	result := []string{}
	for _, id := range tracks {
		if !removeMap[id] {
			result = append(result, id)
		}
	}
	return result
}