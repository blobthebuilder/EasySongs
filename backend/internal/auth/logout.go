package auth

import (
	"net/http"
	"os"

	"github.com/blobthebuilder/easysongs/internal/session"
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// Get the session
	session, err := session.Store.Get(r, "session")
	if err != nil {
		http.Error(w, "Could not get session", http.StatusInternalServerError)
		return
	}

	// Remove all session values
	session.Values = make(map[interface{}]interface{})

	// Set MaxAge < 0 to delete the cookie in the browser
	session.Options.MaxAge = -1

	// Save the session, which sends the Set-Cookie header to remove it
	if err := session.Save(r, w); err != nil {
		http.Error(w, "Could not save session", http.StatusInternalServerError)
		return
	}

	// Redirect to homepage or login page
	http.Redirect(w, r, os.Getenv("FRONTEND_URL"), http.StatusFound)
}