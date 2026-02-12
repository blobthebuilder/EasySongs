"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { History, Check, X } from "lucide-react";
import { apiFetch } from "@/lib/api/fetch";

export default function SaveVersionButton({
  playlistId,
}: {
  playlistId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus the input as soon as it appears
  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  const handleSave = async () => {
    if (loading || !snapshotName.trim()) return;

    setLoading(true);
    try {
      const data = await apiFetch(`/api/playlists/${playlistId}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot_name: snapshotName }), // Sending the name here!
      });

      setSnapshotName("");
      setShowInput(false);
      if (data && data.message) {
        alert(data.message);
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to save version:", err);
    } finally {
      setLoading(false);
    }
  };

  if (showInput) {
    return (
      <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded-full border border-zinc-700 animate-in fade-in zoom-in duration-200">
        <input
          ref={inputRef}
          type="text"
          value={snapshotName}
          onChange={(e) => setSnapshotName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Name this version..."
          className="bg-transparent text-white text-xs px-3 py-1 outline-none w-40"
        />
        <button
          onClick={handleSave}
          className="bg-green-500 hover:bg-green-400 p-1.5 rounded-full text-black transition-colors">
          <Check
            size={14}
            strokeWidth={3}
          />
        </button>
        <button
          onClick={() => setShowInput(false)}
          className="hover:bg-zinc-700 p-1.5 rounded-full text-zinc-400 transition-colors">
          <X
            size={14}
            strokeWidth={3}
          />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      disabled={loading}
      className="bg-white hover:bg-[#f2f2f2] text-black text-xs font-bold py-2 px-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
      <History
        size={16}
        strokeWidth={3}
      />
      SAVE VERSION
    </button>
  );
}
