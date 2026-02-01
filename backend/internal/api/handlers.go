package api

import (
	"encoding/json"
	"net/http"
	"sync"

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

    var (
		tracks   []spotify.SpotifyTrack // Replace with your actual track type
		metadata *spotify.MetadataResponse // Replace with your actual metadata type
		trackErr error
		metaErr  error
		wg       sync.WaitGroup
	)

    wg.Add(2)

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

	wg.Wait()

    if trackErr != nil || metaErr != nil {
		http.Error(w, "Failed to fetch data from Spotify", http.StatusInternalServerError)
		return
	}

    response := spotify.PlaylistDetailsResponse{
        Name:   metadata.Name,
        Images: metadata.Images,
        Tracks: tracks,
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

	// 1. Define the batch size
	batchSize := 100
	totalTracks := len(req.TrackIDs)

	// 2. Loop through tracks in chunks
	for i := 0; i < totalTracks; i += batchSize {
		end := i + batchSize
		if end > totalTracks {
			end = totalTracks
		}

		// Get the current slice chunk
		chunk := req.TrackIDs[i:end]
		
		// Convert IDs to URIs
		var uris []string
		for _, id := range chunk {
			uris = append(uris, "spotify:track:"+id)
		}

		// 3. Send the request for this specific chunk
		err := sendAddTracksRequest(playlistID, uris, token.AccessToken)
		if err != nil {
			http.Error(w, "Error adding batch: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "All tracks added successfully"})
}

