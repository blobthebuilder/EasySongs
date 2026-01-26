package spotify

import "time"

type SpotifyToken struct {
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
}

// response from requesting a new token using refreshtoken
type SpotifyTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn   int    `json:"expires_in"`
}


type SpotifyTrack struct {
    ID     string `json:"id"`
    Name   string `json:"name"`
    Artists []Artist `json:"artists"`
	URI string `json:"uri"`
}

type Artist struct {
    Name string `json:"name"`
}

type SpotifyTrackWrapper struct {
    AddedAt string       `json:"added_at"`
    Track   SpotifyTrack `json:"track"`
}

type SpotifyTrackPage struct {
	Items []SpotifyTrackWrapper `json:"items"`
	Next  string            `json:"next"`
}


type SpotifyPlaylist struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	SnapshotID string `json:"snapshot_id"`
}

type SpotifyPlaylistPage struct {
	Items []SpotifyPlaylist `json:"items"`
	Next  string            `json:"next"`
}

type TrackURIs struct {
    URI string `json:"uri"`
}

type RemoveDuplicatesPlaylistRequest struct {
    Tracks     []TrackURIs `json:"tracks"`
    SnapshotID string   `json:"snapshotId"`
}

type RemoveTracksResponse struct {
    SnapshotID string `json:"snapshot_id"`
}