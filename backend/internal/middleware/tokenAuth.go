package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/blobthebuilder/easysongs/internal/db"
	"github.com/blobthebuilder/easysongs/internal/spotify"
)

const SpotifyTokenKey ctxKey = "spotify_token"

func RequireSpotifyToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(UserIDKey).(string)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		token, err := db.GetAccessToken(userID)
		if err != nil {
			http.Error(w, "Failed to load Spotify token", http.StatusUnauthorized)
			return
		}

		// Refresh if expired
		if token.ExpiresAt.Before(time.Now()) {
			refreshed, err := spotify.RefreshSpotifyToken(token.RefreshToken)
			if err != nil {
				http.Error(w, "Failed to refresh Spotify token", http.StatusUnauthorized)
				return
			}

			if err := db.UpdateSpotifyTokens(
				userID,
				refreshed.AccessToken,
				refreshed.RefreshToken,
				refreshed.ExpiresAt,
			); err != nil {
				http.Error(w, "Failed to save Spotify token", http.StatusInternalServerError)
				return
			}

			token = refreshed
		}

		ctx := context.WithValue(r.Context(), SpotifyTokenKey, token)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}