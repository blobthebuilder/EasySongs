package api

import (
	"encoding/json"
	"net/http"
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json") // tell the client it’s JSON
    w.WriteHeader(http.StatusOK)

    resp := map[string]string{"status": "ok"} // your JSON object
    jsonData, err := json.Marshal(resp)
    if err != nil {
        http.Error(w, `{"status":"error"}`, http.StatusInternalServerError)
        return
    }

    w.Write(jsonData)
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
