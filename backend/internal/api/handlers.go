package api

import (
	"encoding/json"
	"net/http"
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("ok"))
}

func getPlaylistsHandler(w http.ResponseWriter, r *http.Request) {
    // For now, just a dummy response
    playlists := []string{"Chill Hits", "Workout Mix"}
    json.NewEncoder(w).Encode(playlists)
}

func copyHandler(w http.ResponseWriter, r *http.Request) {
    // Later: parse JSON from frontend
    w.WriteHeader(http.StatusNotImplemented)
}

func getLikedSongsHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusNotImplemented)
}
