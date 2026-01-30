"use client";

import { addPlaylistToLiked } from "@/lib/api/addPlaylistToLiked";

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
