"use client";

import { useEffect, useState } from "react";
import { ApiTrack } from "@/types/api/tracks";
import { fetchLikedSongs } from "@/lib/api/liked";

export default function LikedPage() {
  const [likedSongs, setLikedSongs] = useState<ApiTrack[]>([]);

  useEffect(() => {
    fetchLikedSongs().then(setLikedSongs);
  }, []);

  return (
    <div>
      <h1>Liked Songs</h1>
      <ul>
        {likedSongs.map((t) => (
          <li key={t.id}>
            {t.name} — {t.artists.map((a) => a.name).join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
