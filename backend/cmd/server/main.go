package main

import (
	"log"
	"net/http"

	"github.com/joho/godotenv"

	"github.com/blobthebuilder/easysongs/internal/api"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on OS environment")
	}
	
    router := api.NewRouter()
	
    log.Println("Server running on :8080")
    log.Fatal(http.ListenAndServe(":8080", router))
}
