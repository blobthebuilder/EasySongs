"use client";

import { useState } from "react";
import { addPlaylistToLiked } from "@/lib/api/addPlaylistToLiked";

export default function AddPlaylistButton({
  playlistId,
}: {
  playlistId: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await addPlaylistToLiked(playlistId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black text-xs font-bold py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50">
      {loading ? (
        <span className="animate-pulse">Adding tracks...</span>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round">
            <line
              x1="12"
              y1="5"
              x2="12"
              y2="19"></line>
            <line
              x1="5"
              y1="12"
              x2="19"
              y2="12"></line>
          </svg>
          SAVE ALL TO LIKED
        </>
      )}
    </button>
  );
}
