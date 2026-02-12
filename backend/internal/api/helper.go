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

func calculateDiff(oldState map[string][]int, currentState map[string][]int) db.PlaylistDiff {
    diff := db.PlaylistDiff{
        SongsAdded:   []string{},
        SongsRemoved: []string{},
        TagsAdded:    make(map[string][]int),
        TagsRemoved:  make(map[string][]int),
    }

    // 1. Check for Additions and Tag Changes
    for songID, currentTags := range currentState {
        oldTags, exists := oldState[songID]
        
        if !exists {
            // Song is entirely new to the snapshot system
            diff.SongsAdded = append(diff.SongsAdded, songID)
            if len(currentTags) > 0 {
                diff.TagsAdded[songID] = currentTags
            }
        } else {
            // Song exists in both, check if tags changed
            added, removed := compareTags(oldTags, currentTags)
            if len(added) > 0 {
                diff.TagsAdded[songID] = added
            }
            if len(removed) > 0 {
                diff.TagsRemoved[songID] = removed
            }
        }
    }

    // 2. Check for Removals
    for songID := range oldState {
        if _, exists := currentState[songID]; !exists {
            diff.SongsRemoved = append(diff.SongsRemoved, songID)
        }
    }

    return diff
}

// Helper to find differences between two slices of Tag IDs
func compareTags(oldTags, newTags []int) (added, removed []int) {
    oldMap := make(map[int]bool)
    newMap := make(map[int]bool)

    for _, id := range oldTags { oldMap[id] = true }
    for _, id := range newTags { newMap[id] = true }

    for id := range newMap {
        if !oldMap[id] { added = append(added, id) }
    }
    for id := range oldMap {
        if !newMap[id] { removed = append(removed, id) }
    }
    return
}

func reconstructPlaylist(history []db.Snapshot) map[string][]int {
    currentState := make(map[string][]int)
    if len(history) == 0 {
        return currentState
    }

    anchorIndex := -1
    // Find the latest 'full' snapshot
    for i, snap := range history {
        if snap.Type == "full" {
            // Unmarshal the raw bytes into the map
            if err := json.Unmarshal(snap.SnapshotData, &currentState); err != nil {
                return currentState
            }
            anchorIndex = i
            break
        }
    }

    if anchorIndex == -1 {
        return currentState
    }

    // Apply diffs forward in time
    for i := anchorIndex - 1; i >= 0; i-- {
		var diff db.PlaylistDiff
		json.Unmarshal(history[i].SnapshotData, &diff)

		// 1. Handle Song Membership
		for _, id := range diff.SongsRemoved {
			delete(currentState, id)
		}
		for _, id := range diff.SongsAdded {
			if _, exists := currentState[id]; !exists {
				currentState[id] = []int{} // Initialize empty tag list for new song
			}
		}

		// 2. Handle Tag Changes
		for songID, tagIDs := range diff.TagsRemoved {
			currentState[songID] = filterTags(currentState[songID], tagIDs)
		}
		for songID, tagIDs := range diff.TagsAdded {
			currentState[songID] = append(currentState[songID], tagIDs...)
			currentState[songID] = uniqueInts(currentState[songID])
		}
	}

    return currentState
}

// Helper: Removes specific tags from a song's tag list
func filterTags(current []int, toRemove []int) []int {
    removeMap := make(map[int]bool)
    for _, id := range toRemove {
        removeMap[id] = true
    }

    result := []int{}
    for _, id := range current {
        if !removeMap[id] {
            result = append(result, id)
        }
    }
    return result
}

// Helper: Ensures no duplicate tag IDs in a song
func uniqueInts(input []int) []int {
    u := make([]int, 0, len(input))
    m := make(map[int]bool)
    for _, val := range input {
        if !m[val] {
            m[val] = true
            u = append(u, val)
        }
    }
    return u
}