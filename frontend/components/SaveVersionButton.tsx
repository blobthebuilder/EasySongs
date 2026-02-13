"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { History, Check, X } from "lucide-react";
import { apiFetch } from "@/lib/api/fetch";
import BeanButton from "./BeanButton";

export default function SaveVersionButton({
  playlistId,
  size = "lg",
}: {
  playlistId: string;
  size?: "sm" | "md" | "lg";
}) {
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
        body: JSON.stringify({ snapshot_name: snapshotName }),
      });

      setSnapshotName("");
      setShowInput(false);
      if (data && data.message) alert(data.message);
      router.refresh();
    } catch (err) {
      console.error("Failed to save version:", err);
    } finally {
      setLoading(false);
    }
  };

  // Define heights to match BeanButton sizes exactly
  const heightMap = {
    sm: "h-7",
    md: "h-9",
    lg: "h-11",
  };

  if (showInput) {
    return (
      <div
        className={`flex items-center gap-1 bg-[#282828] p-1 rounded-full border border-white/10 animate-in fade-in zoom-in duration-200 ${heightMap[size]}`}>
        <input
          ref={inputRef}
          type="text"
          value={snapshotName}
          onChange={(e) => setSnapshotName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Name this version..."
          className="bg-transparent text-white text-[11px] px-3 outline-none w-40 placeholder:text-zinc-500"
        />
        <button
          onClick={handleSave}
          className="bg-[#1DB954] hover:bg-[#1ed760] p-1.5 rounded-full text-black transition-colors">
          <Check
            size={14}
            strokeWidth={3}
          />
        </button>
        <button
          onClick={() => setShowInput(false)}
          className="hover:bg-white/10 p-1.5 rounded-full text-zinc-400 transition-colors">
          <X
            size={14}
            strokeWidth={3}
          />
        </button>
      </div>
    );
  }

  return (
    <BeanButton
      onClick={() => setShowInput(true)}
      disabled={loading}
      variant="secondary" // Changed to secondary (glass look) to match Duplicates button
      size={size}
      className="bg-white text-black hover:bg-[#f2f2f2]" // Overriding colors to keep the "White Button" look if you prefer
    >
      <div className="flex items-center gap-2">
        <History
          size={16}
          strokeWidth={3}
        />
        <span>SAVE VERSION</span>
      </div>
    </BeanButton>
  );
}
