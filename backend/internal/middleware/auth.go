package middleware

import (
	"context"
	"net/http"

	"github.com/blobthebuilder/easysongs/internal/session"
)

type ctxKey string

const UserIDKey ctxKey = "user_id"

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, err := session.Store.Get(r, "session")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, ok := session.Values["user_id"].(string)
		if !ok || userID == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}