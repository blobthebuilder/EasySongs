package api

import (
	"net/http"

	"github.com/blobthebuilder/easysongs/internal/auth"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

// NewRouter sets up all routes and middleware
func NewRouter() http.Handler {
    r := chi.NewRouter()

    // Middleware example: CORS for your React frontend
    r.Use(cors.Handler(cors.Options{
        AllowedOrigins:   []string{"http://localhost:5173"}, // React dev server
        AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
        AllowedHeaders:   []string{"Authorization", "Content-Type"},
        AllowCredentials: true,
    }))

    // Health check route
    r.Get("/health", healthHandler)

    // Group API routes
    r.Route("/api", func(r chi.Router) {
        r.Get("/playlists", getPlaylistsHandler) // GET /api/playlists
        r.Post("/copy", copyHandler)             // POST /api/copy
        r.Get("/liked", getLikedSongsHandler)    // GET /api/liked
    })

    r.Route("/auth", func(r chi.Router) {
        r.Get("/login", auth.SpotifyLogin)
        r.Get("/callback", auth.SpotifyCallback)
    })

    return r
}
