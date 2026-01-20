package spotify

import "time"

type SpotifyToken struct {
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
}


