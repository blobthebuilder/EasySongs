package db

import (
	"encoding/json"
	"time"
)

// TagInfo represents the display data for a tag
type TagInfo struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

type SnapshotType string

const (
    SnapshotFull SnapshotType = "full"
    SnapshotDiff SnapshotType = "diff"
)

type Snapshot struct {
    ID           int             `db:"id"`
    PlaylistID   string          `db:"playlist_id"`
    Type         SnapshotType    `db:"snapshot_type"`
    SnapshotData json.RawMessage        `db:"snapshot_data"` // map of song ids to tags
    SnapshotName string  `db:"snapshot_name"`
    CreatedAt    time.Time       `db:"created_at"`
}

type PlaylistDiff struct {
// Songs added/removed from the playlist entirely
    SongsAdded   []string `json:"songs_added,omitempty"`
    SongsRemoved []string `json:"songs_removed,omitempty"`

    // Tag changes for specific songs
    // Map: SongID -> [TagIDs]
    TagsAdded   map[string][]int `json:"tags_added,omitempty"`
    TagsRemoved map[string][]int `json:"tags_removed,omitempty"`
}

func (d PlaylistDiff) IsEmpty() bool {
    return len(d.SongsAdded) == 0 && 
           len(d.SongsRemoved) == 0 && 
           len(d.TagsAdded) == 0 && 
           len(d.TagsRemoved) == 0
}