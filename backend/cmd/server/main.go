package main

import (
	"log"
	"net/http"

	"github.com/blobthebuilder/easysongs/internal/api"
)

func main() {
    router := api.NewRouter()
	
    log.Println("Server running on :8080")
    log.Fatal(http.ListenAndServe(":8080", router))
}
