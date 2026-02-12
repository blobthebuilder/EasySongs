package db

import "time"

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
    SnapshotData []byte          `db:"snapshot_data"` // We keep it as raw bytes to Unmarshal later
    CreatedAt    time.Time       `db:"created_at"`
}

type PlaylistDiff struct {
    Added   []string `json:"added"`
    Removed []string `json:"removed"`
}