package api

import (
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