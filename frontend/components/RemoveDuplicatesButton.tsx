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
    if (!confirm("Are you sure you want to remove duplicates?")) return;

    setIsPending(true);
    try {
      const res = await removeDuplicatesPlaylists(playlistId, {
        albumTypePriority: ["album", "single", "compilation"],
        prioExplicit: true,
      });

      if (res.duplicates) {
        alert("Duplicates removed successfully!");
        // This is the magic: it refreshes the Server Component
        // track list without a full page reload.
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
      className={`px-4 py-2 rounded font-medium ${
        isPending
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-red-600 hover:bg-red-700 text-white"
      }`}>
      {isPending ? "Removing..." : "Remove Duplicates"}
    </button>
  );
}
