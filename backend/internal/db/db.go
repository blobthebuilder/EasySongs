package db

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/blobthebuilder/easysongs/internal/spotify"
	_ "github.com/lib/pq"
)

var db *sql.DB

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
    db, err = sql.Open("postgres", dsn) 
    if err != nil {
        log.Fatal("Failed to open DB:", err)
    }

    // configure connection pool
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(25)
    db.SetConnMaxLifetime(0) // unlimited, or time.Hour

    if err := db.Ping(); err != nil {
        log.Fatal("Failed to ping DB:", err)
    }

    log.Println("Connected to Postgres successfully")
}

// InsertSpotifyUser inserts or updates a Spotify user in the database
func InsertSpotifyUser(spotifyUserID string, accessToken string, refreshToken string, expiresIn int) error {
	expiresAt := time.Now().Add(time.Duration(expiresIn) * time.Second)
	_, err := db.Exec(`
        INSERT INTO spotify_users (spotify_user_id, access_token, refresh_token, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (spotify_user_id) DO UPDATE
        SET access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            expires_at = EXCLUDED.expires_at
    `, spotifyUserID, accessToken, refreshToken, expiresAt)

	return err
}

func GetAccessToken(userID string) (spotify.SpotifyToken, error) {
	var tokens spotify.SpotifyToken
	err := db.QueryRow(`
		SELECT access_token, refresh_token, expires_at
		FROM spotify_users
		WHERE spotify_user_id = $1
	`, userID).Scan(&tokens.AccessToken, &tokens.RefreshToken, &tokens.ExpiresAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return tokens, errors.New("user not found")
		}
		return tokens, err
	}
	return tokens, nil
}

func UpdateSpotifyTokens(userID, accessToken, refreshToken string, expiresAt time.Time) error {
    // If refreshToken is empty, we don't want to overwrite it.
    if refreshToken == "" {
        _, err := db.Exec(`
            UPDATE spotify_users
            SET access_token = $1, expires_at = $2
            WHERE spotify_user_id = $3
        `, accessToken, expiresAt, userID)
        return err
    }

    _, err := db.Exec(`
        UPDATE spotify_users
        SET access_token = $1, refresh_token = $2, expires_at = $3
        WHERE spotify_user_id = $4
    `, accessToken, refreshToken, expiresAt, userID)
    return err
}