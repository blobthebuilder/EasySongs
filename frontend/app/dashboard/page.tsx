"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiPlaylist } from "@/types/api/playlists";
import { ApiTrack } from "@/types/api/tracks";
import { fetchPlaylists } from "@/lib/api/playlists";
import { fetchPlaylistTracks } from "@/lib/api/tracks";
import { addPlaylistToLiked } from "@/lib/api/liked";

export default function DashboardPage() {
  const router = useRouter();

  const [playlists, setPlaylists] = useState<ApiPlaylist[]>([]);
  const [tracksByPlaylist, setTracksByPlaylist] = useState<
    Record<string, ApiTrack[]>
  >({});

  useEffect(() => {
    fetchPlaylists().then(setPlaylists);
  }, []);

  const fetchTracks = async (playlistId: string) => {
    const data = await fetchPlaylistTracks(playlistId);
    setTracksByPlaylist((prev) => ({
      ...prev,
      [playlistId]: data,
    }));
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <button onClick={() => router.push("/liked")}>Go to Liked Songs</button>

      <h2>Playlists</h2>
      <ul>
        {playlists.map((p) => (
          <li key={p.id}>
            <button
              onClick={() =>
                router.push(`/playlist/${p.id}?snapshotId=${p.snapshot_id}`)
              }>
              {p.name}
            </button>

            <button onClick={() => addPlaylistToLiked(p.id)}>
              Add to Liked Songs
            </button>

            {tracksByPlaylist[p.id] && (
              <ul>
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
    </div>
  );
}
