package api

import (
	"bytes"
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
}

type PlaylistDetailsResponse struct {
    Name   string               `json:"name"`
    Images []spotify.ImageObject `json:"images"`
    Tracks []spotify.SpotifyTrack      `json:"tracks"` 
	Tags map[string][]db.TagInfo  `json:"tags"`
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