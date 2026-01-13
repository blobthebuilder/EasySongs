package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// creates a store to keep the database connection
func Init(){
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname,
	)

	var err error
    DB, err = sql.Open("postgres", dsn) 
    if err != nil {
        log.Fatal("Failed to open DB:", err)
    }

    // configure connection pool
    DB.SetMaxOpenConns(25)
    DB.SetMaxIdleConns(25)
    DB.SetConnMaxLifetime(0) // unlimited, or time.Hour

    if err := DB.Ping(); err != nil {
        log.Fatal("Failed to ping DB:", err)
    }

    log.Println("Connected to Postgres successfully")
}

// InsertSpotifyUser inserts or updates a Spotify user in the database
func InsertSpotifyUser(spotifyUserID string, accessToken string, refreshToken string, expiresIn int) error {
	expiresAt := time.Now().Add(time.Duration(expiresIn) * time.Second)
	_, err := DB.Exec(`
        INSERT INTO spotify_users (spotify_user_id, access_token, refresh_token, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (spotify_user_id) DO UPDATE
        SET access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            expires_at = EXCLUDED.expires_at
    `, spotifyUserID, accessToken, refreshToken, expiresAt)

	return err
}