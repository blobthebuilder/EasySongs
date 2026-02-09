Website that gives you the features that Spotify doesn't have

Features
Removing duplicated songs in playlists
Quickly copy and paste tracks from playlists and liked songs

Made using Go and Next.js

SETUP:
npm install

go run ./cmd/server

install postgressql

CREATE USER root_user WITH PASSWORD 'your_secure_password';
ALTER USER root_user WITH SUPERUSER;
CREATE DATABASE easy_songs;
GRANT ALL PRIVILEGES ON DATABASE easy_songs TO root_user;

For mac:
brew services start postgresql@16

brew services stop postgresql@16

- this runs in your background, so can turn off if you don't want it
