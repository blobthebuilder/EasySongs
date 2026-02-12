package api

import (
	"net/http"

	"github.com/blobthebuilder/easysongs/internal/auth"
	"github.com/blobthebuilder/easysongs/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

// NewRouter sets up all routes and middleware
func NewRouter() http.Handler {
    r := chi.NewRouter()

    // Middleware example: CORS for your React frontend
    r.Use(cors.Handler(cors.Options{
        AllowedOrigins:   []string{"http://127.0.0.1:3000", "http://localhost:3000"}, // React dev server
        AllowedMethods:   []string{"GET", "POST", "OPTIONS", "PUT", "DELETE"},
        AllowedHeaders:   []string{"Authorization", "Content-Type"},
        AllowCredentials: true,
    }))

    // Health check route
    r.Get("/health", healthHandler)

    // Group API routes
    r.Route("/api", func(r chi.Router) {
        r.Use(middleware.RequireAuth)
        r.Use(middleware.RequireSpotifyToken)

        r.Get("/liked", getLikedSongsHandler)  // GET liked songs
        r.Get("/liked/details", getLikedSongsDetailsHandler)  // GET liked songs

        r.Route("/playlists", func(r chi.Router) {
            r.Get("/", getPlaylistsHandler) // GET all playlists

            // Single Playlist Actions
            r.Route("/{playlistID}", func(r chi.Router) {
                r.Get("/details", getPlaylistDetailsHandler) // playlist details
                r.Post("/copy-to-liked", copyToLikedHandler) // copy playlist to liked songs
                r.Post("/remove-duplicates", removeDuplicatesHandler) // remove dupes

                r.Post("/version", saveVersionHandler) // save version 
                
                r.Post("/tags", addTagToTracksHandler) // add tags to tracks in playlist
                r.Delete("/tags", removeTagsFromTracksHandler)

                // Track-specific actions within a playlist
                r.Route("/tracks", func(r chi.Router) {
                    r.Get("/", getPlaylistTracksHandler) // get all tracks in playlist
                    r.Post("/", addTracksToPlaylistHandler) // add tracks to playlist
                    r.Delete("/", removeTracksHandler) // delete tracks from playlist
                })

                
            })
        })
    })

    r.Route("/auth", func(r chi.Router) {
        r.Get("/login", auth.SpotifyLogin)
        r.Get("/callback", auth.SpotifyCallback)
        r.Get("/logout", auth.LogoutHandler)
    })

    return r
}
