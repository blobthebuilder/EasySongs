"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { apiFetch } from "@/lib/api/fetch";

export default function SaveVersionButton({
  playlistId,
}: {
  playlistId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      // Calling your Go backend endpoint
      const data = await apiFetch(`/api/playlists/${playlistId}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (data && data.message) {
        // This will now display "Initial snapshot created!" or whatever Go sent
        alert(data.message);
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to save version:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className="bg-white hover:bg-[#f2f2f2] text-black text-xs font-bold py-2 px-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:bg-zinc-600">
      {loading ? (
        <span className="animate-pulse">SAVING SNAPSHOT...</span>
      ) : (
        <>
          <History
            size={16}
            strokeWidth={3}
          />
          SAVE VERSION
        </>
      )}
    </button>
  );
}
