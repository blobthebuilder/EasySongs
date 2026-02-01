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
	Album  Album `json:"album"`
	Explicit bool `json:"explicit"`
}

type Album struct{
	Type string `json:"album_type"`
	Name string `json:"name"`
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

type ImageObject struct{
	Url string `json:"url"`
	Height int `json:"height"`
	Width int `json:"width"`
}

type SpotifyPlaylist struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	SnapshotID string `json:"snapshot_id"`
	Images []ImageObject `json:"images"`
	Tracks TracksObject `json:"tracks"`
}

type TracksObject struct {
	Total int `json:"total"`
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

type MetadataRequest struct{
	PlaylistID string `json:"playlist_id"`
	Fields string `json:"fields"`
}

type MetadataResponse struct{
	Collaborative bool   `json:"collaborative"`
    SnapshotID    string `json:"snapshot_id"`
    Name          string `json:"name"`
    Description string `json:"description"`
	Images []ImageObject `json:"images"`
}

type PlaylistDetailsResponse struct {
    Name   string               `json:"name"`
    Images []ImageObject `json:"images"`
    Tracks []SpotifyTrack      `json:"tracks"` 
}