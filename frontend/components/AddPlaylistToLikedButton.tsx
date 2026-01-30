"use client";

import { addPlaylistToLiked } from "@/lib/api/liked";

export default function AddPlaylistButton({
  playlistId,
}: {
  playlistId: string;
}) {
  return (
    <button onClick={() => addPlaylistToLiked(playlistId)}>
      Add to Liked Songs
    </button>
  );
}
