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
    Artist string `json:"artist"`
}

type SpotifyPlaylist struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type SpotifyPlaylistPage struct {
	Items []SpotifyPlaylist `json:"items"`
	Next  string            `json:"next"`
}
