"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/fetch";

type Playlist = {
  id: string;
  name: string;
};

type Track = {
  id: string;
  name: string;
  artists: { name: string }[];
};

export default function DashboardPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracksByPlaylist, setTracksByPlaylist] = useState<
    Record<string, Track[]>
  >({});
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);

  const logout = () => {
    window.location.href = "http://127.0.0.1:8080/auth/logout";
  };

  const fetchPlaylists = async () => {
    try {
      const data = await apiFetch("http://127.0.0.1:8080/api/playlists");
      setPlaylists(data);
    } catch (err) {
      console.error("Failed to load playlists", err);
    }
  };

  const fetchTracks = async (playlistId: string) => {
    try {
      const data = await apiFetch(
        `http://127.0.0.1:8080/api/playlists/${playlistId}/tracks`,
      );
      setTracksByPlaylist((prev) => ({
        ...prev,
        [playlistId]: data,
      }));
    } catch (err) {
      console.error("Failed to load tracks", err);
    }
  };

  const fetchLikedSongs = async () => {
    try {
      const data = await apiFetch("http://127.0.0.1:8080/api/liked");
      setLikedSongs(data);
    } catch (err) {
      console.error("Failed to load liked songs", err);
    }
  };

  const addPlaylistToLikedSongs = async (playlistId: string) => {
    try {
      await apiFetch(
        `http://127.0.0.1:8080/api/playlists/${playlistId}/copy-to-liked`,
        {
          method: "POST",
        },
      );
      alert("Playlist added to liked songs!");
      fetchLikedSongs(); // refresh liked songs
    } catch (err) {
      console.error("Failed to add playlist", err);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    fetchLikedSongs();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <button onClick={logout}>Logout</button>
      <button onClick={fetchPlaylists}>Reload Playlists</button>

      <h2 className="mt-6 text-xl font-semibold">Playlists</h2>
      <ul>
        {playlists.map((p) => (
          <li
            key={p.id}
            className="my-2">
            <button onClick={() => fetchTracks(p.id)}>
              {p.name} — {p.id}
            </button>
            <button onClick={() => addPlaylistToLikedSongs(p.id)}>
              Add to Liked Songs
            </button>

            {/* Display tracks if fetched */}
            {tracksByPlaylist[p.id] && (
              <ul className="mt-2">
                {tracksByPlaylist[p.id].map((t) => (
                  <li key={t.id}>
                    {t.name} — {t.artists.map((a) => a.name).join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Liked Songs</h2>
      <button onClick={fetchLikedSongs}>Refresh Liked Songs</button>
      <ul className="mt-2">
        {likedSongs.map((t) => (
          <li key={t.id}>
            {t.name} — {t.artists.map((a) => a.name).join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
