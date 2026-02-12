package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/blobthebuilder/easysongs/internal/db"
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

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(playlists)
}

func getPlaylistTracksHandler(w http.ResponseWriter, r *http.Request) {
    playlistID := chi.URLParam(r, "playlistID")
    
    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)

    tracks, err := spotify.GetTracksFromPlaylist(token.AccessToken, playlistID)
    if err != nil {
        http.Error(w, "Failed to get tracks", http.StatusInternalServerError)
        return
    }

    userID, ok := r.Context().Value(middleware.UserIDKey).(string)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    tagsMap, err := db.GetPlaylistTagsMap(userID, playlistID)
    if err != nil {
        log.Printf("DB Error fetching tags: %v", err)
        tagsMap = make(map[string][]db.TagInfo)
    }

    response := struct {
        Tracks []spotify.SpotifyTrack   `json:"tracks"`
        Tags   map[string][]db.TagInfo `json:"tags"`
    }{
        Tracks: tracks,
        Tags:   tagsMap,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
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

func getLikedSongsHandler(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)
    
    songs, err := spotify.GetSavedSongs(token.AccessToken)
    if err != nil{
        http.Error(w, "Failed to fetch liked songs", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(songs)
}

func getLikedSongsDetailsHandler(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)

    userID, ok := r.Context().Value(middleware.UserIDKey).(string)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    var (
		songs   []spotify.SpotifyTrack 
        tags     map[string][]db.TagInfo
	    songsErr error
        tagsErr  error
		wg       sync.WaitGroup
	)

    wg.Add(2)

    go func() {
		defer wg.Done()
		songs, songsErr = spotify.GetSavedSongs(token.AccessToken)
	}()

    // get tags
    go func() {
        defer wg.Done()
        tags, tagsErr = db.GetPlaylistTagsMap(userID, "liked-songs")
    }()

    wg.Wait()

    if songsErr != nil || tagsErr != nil{
        http.Error(w, "Failed to fetch liked songs data", http.StatusInternalServerError)
		return
    }

	

    response := LikedSongsDetailsResponse{
        Tracks: songs,
        Tags: tags,
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

func removeDuplicatesHandler(w http.ResponseWriter, r *http.Request){
    var req RemoveDuplicatesPlaylistRequest
    err := json.NewDecoder(r.Body).Decode(&req)
    if err != nil || len(req.AlbumTypePriority) != 3 {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    prioNonexplicit := true
    if req.PrioNonexplicit != nil{
        prioNonexplicit = *req.PrioNonexplicit
    }

    albumPrio := albumTypePriorityMap(req.AlbumTypePriority)

    playlistID := chi.URLParam(r, "playlistID")

    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)

    metadata, err := spotify.GetPlaylistMetadata(token.AccessToken, playlistID, []string{"snapshot_id"})
    if err != nil {
        http.Error(w, "Failed to fetch playlist status", http.StatusInternalServerError)
        return
    }
    currentSnapshotID := metadata.SnapshotID

    tracks, err :=  spotify.GetTracksFromPlaylist(token.AccessToken, playlistID)
    if err != nil {
        http.Error(w, "Failed to get tracks", http.StatusInternalServerError)
        return
    }

    seen := make(map[ProcessedTrack]TrackMeta)
    duplicateURIs := []string{}

    for _, track := range tracks{
        processedTrack := ProcessedTrack{
            Name: normalizeTrackName(track.Name),
            Artists: normalizeArtists(track.Artists),
        }

        candidate := TrackMeta{
            URI: track.URI,
            Explicit:  track.Explicit,
            AlbumType: track.Album.Type,
        }

        if existing, exists := seen[processedTrack]; exists {
            // Exact duplicate (same URI) 
            // NEED to think about what happens because spotify will remove all occurences of that uri
            if existing.URI == candidate.URI {
                duplicateURIs = append(duplicateURIs, candidate.URI)
                continue
            }

            if prioNonexplicit{ // do explicit check over album type prio
                if candidate.Explicit && !existing.Explicit{
                    // keep
                    duplicateURIs = append(duplicateURIs, track.URI)
                }else if !candidate.Explicit && existing.Explicit{
                    // replace exisitng
                    duplicateURIs = append(duplicateURIs, existing.URI)
                    seen[processedTrack] = candidate
                }
                // if they are the same, continue to the next one
            }

            if shouldReplaceByAlbumType(existing, candidate, albumPrio) {
                // replace existing
                duplicateURIs = append(duplicateURIs, existing.URI)
                seen[processedTrack] = candidate
            } else {
                // keep existing
                duplicateURIs = append(duplicateURIs, track.URI)
            }
            continue
        }

        seen[processedTrack] = candidate
    }

    if len(duplicateURIs) == 0{ // if no duplicates
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]any{
            "duplicates": false,
        })
        return
    }

    // convert uris into json objects
    processedURIs := make([]spotify.TrackURIs, len(duplicateURIs))
    for i, uri := range duplicateURIs {
        processedURIs[i] = spotify.TrackURIs{URI: uri}
    }

    newSnapshotID, err := spotify.RemoveTracksFromPlaylist(token.AccessToken, playlistID, processedURIs, currentSnapshotID)
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

func getPlaylistDetailsHandler(w http.ResponseWriter, r *http.Request){
    playlistID := chi.URLParam(r, "playlistID")
    
    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)
    
    userID, ok := r.Context().Value(middleware.UserIDKey).(string)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    var (
		tracks   []spotify.SpotifyTrack 
		metadata *spotify.MetadataResponse 
        tags     map[string][]db.TagInfo
		trackErr error
		metaErr  error
        tagsErr  error
		wg       sync.WaitGroup
	)

    wg.Add(3)
    

    // Task 1: Fetch Tracks
	go func() {
		defer wg.Done()
		tracks, trackErr = spotify.GetTracksFromPlaylist(token.AccessToken, playlistID)
	}()

	// Task 2: Fetch Metadata
	go func() {
		defer wg.Done()
		metadata, metaErr = spotify.GetPlaylistMetadata(token.AccessToken, playlistID, []string{"name", "images"})
	}()

    // get tags
    go func() {
        defer wg.Done()
        tags, tagsErr = db.GetPlaylistTagsMap(userID, playlistID)
    }()

	wg.Wait()

    if trackErr != nil || metaErr != nil || tagsErr != nil{
		http.Error(w, "Failed to fetch playlist data", http.StatusInternalServerError)
		return
	}

    response := PlaylistDetailsResponse{
        Name:   metadata.Name,
        Images: metadata.Images,
        Tracks: tracks,
        Tags: tags,
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

func addTracksToPlaylistHandler(w http.ResponseWriter, r *http.Request) {
    playlistID := chi.URLParam(r, "playlistID")
    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)

    var req CopyTracksRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    // 1. Dynamic configuration based on target
    batchSize := 100
    method := "POST"
    baseUrl := fmt.Sprintf("https://api.spotify.com/v1/playlists/%s/tracks", playlistID)

    if playlistID == "liked-songs" {
        batchSize = 50 // Spotify limit for Save Tracks is 50
        method = "PUT"
        baseUrl = "https://api.spotify.com/v1/me/tracks"
    }

    totalTracks := len(req.TrackIDs)

    // 2. Loop through tracks in chunks
    for i := 0; i < totalTracks; i += batchSize {
        end := i + batchSize
        if end > totalTracks {
            end = totalTracks
        }

        chunk := req.TrackIDs[i:end]
        
        // 3. Prepare the specific payload format
        var bodyData []byte
        if playlistID == "liked-songs" {
            // Liked Songs wants: {"ids": ["id1", "id2"]}
            bodyData, _ = json.Marshal(map[string][]string{"ids": chunk})
        } else {
            // Playlists want: {"uris": ["spotify:track:id1", "spotify:track:id2"]}
            var uris []string
            for _, id := range chunk {
                uris = append(uris, "spotify:track:"+id)
            }
            bodyData, _ = json.Marshal(map[string][]string{"uris": uris})
        }

        // 4. Execute the request
        err := executeSpotifyRequest(method, baseUrl, bodyData, token.AccessToken)
        if err != nil {
            http.Error(w, "Error adding batch: "+err.Error(), http.StatusInternalServerError)
            return
        }
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Action completed successfully"})
}


func removeTracksHandler(w http.ResponseWriter, r *http.Request) {
	playlistID := chi.URLParam(r, "playlistID")
    token, _ := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)

    var req CopyTracksRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid body", http.StatusBadRequest)
        return
    }

    // --- Branching Logic ---
    var method string = "DELETE"
    var url string
    var batchSize int

    if playlistID == "liked-songs" {
        // TARGET: User Library
        url = "https://api.spotify.com/v1/me/tracks"
        batchSize = 50 // Spotify library limit is 50
    } else {
        // TARGET: Specific Playlist
        url = fmt.Sprintf("https://api.spotify.com/v1/playlists/%s/tracks", playlistID)
        batchSize = 100 // Playlist limit is 100
    }

    for i := 0; i < len(req.TrackIDs); i += batchSize {
        end := i + batchSize
        if end > len(req.TrackIDs) { end = len(req.TrackIDs) }
        chunk := req.TrackIDs[i:end]

        var body []byte
        if playlistID == "liked-songs" {
            // Liked Songs format: {"ids": ["4iV5W9u01YfvAUvUnpBPkT", ...]}
            body, _ = json.Marshal(map[string][]string{"ids": chunk})
        } else {
            // Playlist format: {"tracks": [{"uri": "spotify:track:4iV5W9u01YfvAUvUnpBPkT"}]}
            type trk struct { URI string `json:"uri"` }
            var tracks []trk
            for _, id := range chunk {
                tracks = append(tracks, trk{URI: "spotify:track:" + id})
            }
            body, _ = json.Marshal(map[string][]trk{"tracks": tracks})
        }

        if err := executeSpotifyRequest(method, url, body, token.AccessToken); err != nil {
            http.Error(w, "Spotify removal error: "+err.Error(), http.StatusInternalServerError)
            return
        }
    }
    w.WriteHeader(http.StatusNoContent)
}

func addTagToTracksHandler(w http.ResponseWriter, r *http.Request) {
    playlistID := chi.URLParam(r, "playlistID")
    userID, ok := r.Context().Value(middleware.UserIDKey).(string)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    
    var body TagBatchRequest
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        http.Error(w, "Invalid body", http.StatusBadRequest)
        return
    }

    if body.TagName == "" || len(body.TrackIDs) == 0 {
        http.Error(w, "TagName and at least one TrackID required", http.StatusBadRequest)
        return
    }
    
    // frontend adds a -index to id, so clean it
    cleanIDs := make([]string, 0, len(body.TrackIDs))
    for _, id := range body.TrackIDs {
        parts := strings.Split(id, "-")
        cleanIDs = append(cleanIDs, parts[0])
    }

    err := db.AddTagsToSongsBatch(userID, playlistID, cleanIDs, body.TagName, body.TagColor)
    if err != nil {
        http.Error(w, "Server error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

func removeTagsFromTracksHandler(w http.ResponseWriter, r *http.Request) {
    // 1. Get IDs from context/URL
    userID, ok := r.Context().Value(middleware.UserIDKey).(string)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    playlistID := chi.URLParam(r, "playlistID")

    // 2. Parse request body
    var body RemoveTagsRequest

    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    if len(body.TrackIDs) == 0 {
        http.Error(w, "At least one TrackID required", http.StatusBadRequest)
        return
    }

    // 3. Clean the IDs (removing the -index suffix from the frontend)
    cleanTrackIDs := make([]string, 0, len(body.TrackIDs))
    for _, id := range body.TrackIDs {
        parts := strings.Split(id, "-")
        cleanTrackIDs = append(cleanTrackIDs, parts[0])
    }

    // If TagIDs is empty, the function deletes all tags for these tracks
    err := db.RemoveTagsFromSongsBatch(userID, playlistID, cleanTrackIDs, body.TagIDs)
    if err != nil {
        log.Printf("Error removing tags: %v", err)
        http.Error(w, "Server error", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

func saveVersionHandler(w http.ResponseWriter, r *http.Request) {
    playlistID := chi.URLParam(r, "playlistID")
    token := r.Context().Value(middleware.SpotifyTokenKey).(spotify.SpotifyToken)
    userID, ok := r.Context().Value(middleware.UserIDKey).(string)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    currentTracks, tracksErr := spotify.GetTracksFromPlaylist(token.AccessToken, playlistID)
    if tracksErr != nil {
        http.Error(w, "Failed to get tracks", http.StatusInternalServerError)
        return
    }

    err := db.EnsurePlaylistExists(playlistID, userID)
    if err != nil{
        http.Error(w, "Failed to get playlist info", http.StatusInternalServerError)
    }

    history, _ := db.GetRecentHistory(playlistID)
    if len(history) == 0{
        db.SaveSnapshot(playlistID, currentTracks, "full")
        w.WriteHeader(http.StatusCreated) // 201 Created
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Initial snapshot created!",
        })
        return
    }

    diffCount := 0

    // Logic to determine if we need a new Full Snapshot
    for _, snap := range history {
        if snap.Type == "full" {
            break
        }
        diffCount++
    }

    if diffCount >= 9 || len(history) == 0 {
        // Save FULL version
        db.SaveSnapshot(playlistID, currentTracks, "full")
    } else {
        // Calculate and save DIFF
        // We need the "current state" of the playlist to diff against
        // which means Reconstructing the playlist from the last Full + intervening Diffs
        currentIDs := make([]string, len(currentTracks))
        for i, track := range currentTracks {
            // Use .ID or .URI depending on how you want to track them
            currentIDs[i] = string(track.ID) 
        }
        currentState := reconstructPlaylist(history) 
        diff := calculateDiff(currentState, currentIDs)
        
        db.SaveSnapshot(playlistID, diff, "diff")
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "message": "Saved",
    })
}