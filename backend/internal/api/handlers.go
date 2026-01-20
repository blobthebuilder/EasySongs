package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/blobthebuilder/easysongs/internal/db"
	"github.com/blobthebuilder/easysongs/internal/middleware"
	"github.com/blobthebuilder/easysongs/internal/spotify"
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)

    json.NewEncoder(w).Encode(map[string]string{
        "status": "ok",
    })
}

func getPlaylistsHandler(w http.ResponseWriter, r *http.Request) {
    userID, ok := r.Context().Value(middleware.UserIDKey).(string)
    if !ok {
	    http.Error(w, "Unauthorized", http.StatusUnauthorized)
	    return
    }
    
    token, err := db.GetAccessToken(userID)
    if err != nil{
        http.Error(w, "Failed to load tokens", http.StatusInternalServerError)
        return
    }

    if token.ExpiresAt.Before(time.Now()){
        refreshed, err := spotify.RefreshSpotifyToken(token.RefreshToken)
        if err != nil{
            http.Error(w, "Failed to refresh token", http.StatusUnauthorized)
            return
        }
        err = db.UpdateSpotifyTokens(userID, refreshed.AccessToken, refreshed.RefreshToken, refreshed.ExpiresAt)
        if err != nil{
            http.Error(w, "Failed to update token", http.StatusInternalServerError)
            return
        }
        token = refreshed
    }
    
    playlists, err := spotify.GetAllPlaylists(token.AccessToken)
    if err != nil{
        http.Error(w, "Failed to fetch playlists", http.StatusBadGateway)
        return
    }

    json.NewEncoder(w).Encode(playlists)
}

func copyHandler(w http.ResponseWriter, r *http.Request) {
    // Later: parse JSON from frontend
    w.WriteHeader(http.StatusNotImplemented)
}

func getLikedSongsHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusNotImplemented)
}
