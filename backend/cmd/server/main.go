package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"

	"github.com/blobthebuilder/easysongs/internal/api"
	"github.com/blobthebuilder/easysongs/internal/db"
	"github.com/blobthebuilder/easysongs/internal/session"
)

func main() {
	// load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on OS environment")
	}

	// connect to db
	db.Init()

	secret:= os.Getenv("SESSION_SECRET_KEY")
	session.Store = sessions.NewCookieStore([]byte(secret))

	// start router
    router := api.NewRouter()
	
    log.Println("Server running on :8080")
    log.Fatal(http.ListenAndServe(":8080", router))
}
