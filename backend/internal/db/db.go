package db

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/blobthebuilder/easysongs/internal/spotify"
	"github.com/lib/pq"
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

    createSchema()

    log.Println("Connected to Postgres successfully")
}

func createSchema() {
	schema := `
	CREATE TABLE IF NOT EXISTS spotify_users (
		spotify_user_id TEXT PRIMARY KEY,
		access_token TEXT NOT NULL,
		refresh_token TEXT NOT NULL,
		expires_at TIMESTAMP NOT NULL
	);

	CREATE TABLE IF NOT EXISTS tags (
		id SERIAL PRIMARY KEY,
		user_id TEXT NOT NULL,
		name TEXT NOT NULL,
		color TEXT,
		UNIQUE(name, user_id)
	);

	CREATE TABLE IF NOT EXISTS playlist_song_tags (
		user_id TEXT NOT NULL,
		playlist_id TEXT NOT NULL,
		song_id TEXT NOT NULL,
		tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
		PRIMARY KEY (user_id, playlist_id, song_id, tag_id)
	);`

	_, err := db.Exec(schema)
	if err != nil {
		log.Fatalf("Failed to create database schema: %v", err)
	}
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

func AddTagsToSongsBatch(userID string, playlistID string, songIDs []string, tagName string, tagColor string) error {
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    defer tx.Rollback()
    // 1. Get or Create the Tag ID
    var tagID int
    err = tx.QueryRow(`
        INSERT INTO tags (name, user_id, color)
        VALUES ($1, $2, $3)
        ON CONFLICT (name, user_id) 
        DO UPDATE SET color = EXCLUDED.color 
        RETURNING id
    `, tagName, userID, tagColor).Scan(&tagID)
    if err != nil {
        return err
    }

    // 2. Batch Link the Tag to all selected songs
    // pq.Array(songIDs) converts the Go slice into a Postgres array format
    _, err = tx.Exec(`
        INSERT INTO playlist_song_tags (user_id, playlist_id, song_id, tag_id)
        SELECT $1, $2, unnest($3::text[]), $4
        ON CONFLICT DO NOTHING
    `, userID, playlistID, pq.Array(songIDs), tagID)
    
    if err != nil {
        return err
    }

    return tx.Commit()
}

// GetPlaylistTagsMap returns a map where key = songID and value = slice of Tags
func GetPlaylistTagsMap(userID string, playlistID string) (map[string][]TagInfo, error) {
	// We use a map for O(1) lookup on the frontend
	tagsMap := make(map[string][]TagInfo)

	rows, err := db.Query(`
		SELECT pst.song_id, t.id, t.name, COALESCE(t.color, '')
		FROM playlist_song_tags pst
		JOIN tags t ON pst.tag_id = t.id
		WHERE pst.user_id = $1 AND pst.playlist_id = $2
	`, userID, playlistID)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var songID string
		var t TagInfo
		
		if err := rows.Scan(&songID, &t.ID, &t.Name, &t.Color); err != nil {
			return nil, err
		}

		// Append the tag to the slice for this specific song
		tagsMap[songID] = append(tagsMap[songID], t)
	}

	return tagsMap, nil
}

func RemoveTagsFromSongsBatch(userID string, playlistID string, songIDs []string, tagIDs []int) error {
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    defer tx.Rollback()

    if len(tagIDs) == 0 {
        // CASE: Remove ALL tags from the selected songs in this playlist
        _, err = tx.Exec(`
            DELETE FROM playlist_song_tags 
            WHERE user_id = $1 
              AND playlist_id = $2 
              AND song_id = ANY($3)
        `, userID, playlistID, pq.Array(songIDs))
    } else {
        // CASE: Remove ONLY specific tags from the selected songs
        _, err = tx.Exec(`
            DELETE FROM playlist_song_tags 
            WHERE user_id = $1 
              AND playlist_id = $2 
              AND song_id = ANY($3)
              AND tag_id = ANY($4)
        `, userID, playlistID, pq.Array(songIDs), pq.Array(tagIDs))
    }

    if err != nil {
        return err
    }

    return tx.Commit()
}