"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeDuplicatesPlaylists } from "@/lib/api/removeDuplicates";

export default function RemoveDuplicatesButton({
  playlistId,
}: {
  playlistId: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    // A more Spotify-like confirmation could be a custom modal, but confirm works for now!
    if (!confirm("Are you sure you want to remove duplicates?")) return;

    setIsPending(true);
    try {
      const res = await removeDuplicatesPlaylists(playlistId, {
        albumTypePriority: ["album", "single", "compilation"],
        prioNonexplicit: false,
      });

      if (res.duplicates) {
        alert("Duplicates removed successfully!");
        router.refresh();
      } else {
        alert("No duplicates found.");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to remove duplicates");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className={`
        flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase transition-all
        ${
          isPending
            ? "border-gray-600 text-gray-600 cursor-not-allowed"
            : "border-[#b3b3b3] text-[#b3b3b3] hover:border-white hover:text-white hover:scale-105 active:scale-95"
        }
      `}>
      {isPending ? (
        <>
          <svg
            className="animate-spin h-3 w-3 text-gray-600"
            viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          PROCESSING...
        </>
      ) : (
        "Remove Duplicates"
      )}
    </button>
  );
}
