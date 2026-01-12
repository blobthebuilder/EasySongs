package auth

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"net/url"
	"os"
)

func randomState() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func SpotifyLogin(w http.ResponseWriter, r *http.Request) {
	state := randomState()

	// Store state in secure cookie (CSRF protection)
	http.SetCookie(w, &http.Cookie{
		Name:     "spotify_oauth_state",
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // true in production (https)
		SameSite: http.SameSiteLaxMode,
	})

	uri := os.Getenv("SPOTIFY_REDIRECT_URI")
	encodedURI := url.QueryEscape(uri)
	
	url := "https://accounts.spotify.com/authorize" +
		"?response_type=code" +
		"&client_id=" + os.Getenv("SPOTIFY_CLIENT_ID") +
		"&scope=user-read-private%20user-read-email" +
		"&redirect_uri=" + encodedURI +
		"&state=" + state
	
	http.Redirect(w, r, url, http.StatusFound)
}
