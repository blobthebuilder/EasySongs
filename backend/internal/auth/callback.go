package auth

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type SpotifyTokenResponse struct {
    AccessToken  string `json:"access_token"`
    TokenType    string `json:"token_type"`
    ExpiresIn    int    `json:"expires_in"`
    RefreshToken string `json:"refresh_token"`
    Scope        string `json:"scope"`
}

func SpotifyCallback(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	code := query.Get("code")
	state := query.Get("state")

	// validate returned state
	cookie, err := r.Cookie("spotify_oauth_state")
	if err != nil || cookie.Value != state {
		http.Error(w, "Invalid state", http.StatusUnauthorized)
		return
	}

	// Exchange code → token
	req, _ := http.NewRequest("POST", "https://accounts.spotify.com/api/token", nil)

	q := req.URL.Query()
	q.Add("grant_type", "authorization_code")
	q.Add("code", code)
	q.Add("redirect_uri", os.Getenv("SPOTIFY_REDIRECT_URI"))
	req.URL.RawQuery = q.Encode()

	req.SetBasicAuth(
		os.Getenv("SPOTIFY_CLIENT_ID"),
		os.Getenv("SPOTIFY_CLIENT_SECRET"),
	)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		http.Error(w, "Token exchange failed", http.StatusUnauthorized)
		return
	}
	defer resp.Body.Close()

	// decode token
	var tokenResp SpotifyTokenResponse
	err = json.NewDecoder(resp.Body).Decode(&tokenResp)
	if err != nil {
		http.Error(w, "Failed to parse token response", http.StatusInternalServerError)
		return
	}
	log.Println("Access Token:", tokenResp.AccessToken)
	log.Println("Refresh Token:", tokenResp.RefreshToken)

	// TODO store token in database


	http.Redirect(
		w,
		r,
		os.Getenv("FRONTEND_URL")+"/dashboard",
		http.StatusFound,
	)
}
