"use client";

import { useState } from "react";
import { addPlaylistToLiked } from "@/lib/api/addPlaylistToLiked";
import BeanButton from "./BeanButton"; // Adjust path as needed

export default function AddPlaylistButton({
  playlistId,
  size = "lg", // Default to large for the header
}: {
  playlistId: string;
  size?: "sm" | "md" | "lg";
}) {
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    // Note: e is passed automatically by BeanButton's onClick
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

  const PlusIcon = (
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
  );

  return (
    <BeanButton
      onClick={handleAdd}
      variant="primary"
      size={size}
      disabled={loading}
      className={loading ? "opacity-70" : ""}>
      {loading ? (
        <span className="animate-pulse">Adding tracks...</span>
      ) : (
        <div className="flex items-center gap-2">
          {PlusIcon}
          <span>SAVE ALL TO LIKED</span>
        </div>
      )}
    </BeanButton>
  );
}
