package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/blobthebuilder/easysongs/internal/middleware"
	"github.com/blobthebuilder/easysongs/internal/spotify"
	"github.com/go-chi/chi/v5"
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)

    json.NewEncoder(w).Encode(map[string]string{
        "status": "ok",
    })
}

func getPlaylistsHandler(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)

    playlists, err := spotify.GetAllPlaylists(token.AccessToken)
    if err != nil{
        http.Error(w, "Failed to fetch playlists", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(playlists)
}

func getPlaylistTracksHandler(w http.ResponseWriter, r *http.Request) {
    playlistID := chi.URLParam(r, "playlistID")
    
    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)

    tracks, err :=  spotify.GetTracksFromPlaylist(token.AccessToken, playlistID)
    if err != nil {
        http.Error(w, "Failed to get tracks", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(tracks)

}

func copyToLikedHandler(w http.ResponseWriter, r *http.Request){
    playlistID := chi.URLParam(r, "playlistID")

    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)

    // get all tracks from playlist
    err :=  spotify.CopyPlaylistToLiked(token.AccessToken, playlistID)
    if err != nil {
        http.Error(w, "Failed to copy playlist to liked songs", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

func copyHandler(w http.ResponseWriter, r *http.Request) {
    // Later: parse JSON from frontend
    w.WriteHeader(http.StatusNotImplemented)
}

func getLikedSongsHandler(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)
    
    songs, err := spotify.GetSavedSongs(token.AccessToken)
    if err != nil{
        http.Error(w, "Failed to fetch liked songs", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(songs)
}

func removeDuplicatesHandler(w http.ResponseWriter, r *http.Request){
    var req RemoveDuplicatesPlaylistRequest
    err := json.NewDecoder(r.Body).Decode(&req)
    if err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }
    
    playlistID := chi.URLParam(r, "playlistID")

    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)

    tracks, err :=  spotify.GetTracksFromPlaylist(token.AccessToken, playlistID)
    if err != nil {
        http.Error(w, "Failed to get tracks", http.StatusInternalServerError)
        return
    }

    seen := make(map[ProcessedTrack]int)
    duplicateURIs := []string{}

    for i, track := range tracks{
        processedTrack := ProcessedTrack{
            Name: normalizeTrackName(track.Name),
            Artists: normalizeArtists(track.Artists),
        }

        if _, exists := seen[processedTrack]; exists {
            duplicateURIs = append(duplicateURIs, track.URI)
            log.Printf("Duplicate found: %s - %s", track.Name, track.URI)
            continue
        }

        seen[processedTrack] = i
    }

    if len(duplicateURIs) == 0{
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]any{
            "duplicates": false,
        })
        return
    }

    processedURIs := make([]spotify.TrackURIs, len(duplicateURIs))
    for i, uri := range duplicateURIs {
        processedURIs[i] = spotify.TrackURIs{URI: uri}
    }

    newSnapshotID, err := spotify.RemoveTracksFromPlaylist(token.AccessToken, playlistID, processedURIs, req.SnapshotID)
    if err != nil {
        http.Error(w, "Failed to remove duplicates", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]any{
        "duplicates": true,
        "snapshotId": newSnapshotID,
    })
}