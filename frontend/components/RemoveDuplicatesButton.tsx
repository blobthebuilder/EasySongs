"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { removeDuplicatesPlaylists } from "@/lib/api/removeDuplicates";
import { ChevronDown, Check } from "lucide-react";

export default function RemoveDuplicatesButton({
  playlistId,
}: {
  playlistId: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [priority, setPriority] = useState(["album", "single", "compilation"]);
  const [prioNonexplicit, setPrioNonexplicit] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove duplicates?")) return;
    setIsPending(true);
    try {
      const res = await removeDuplicatesPlaylists(playlistId, {
        albumTypePriority: priority,
        prioNonexplicit: prioNonexplicit,
      });
      alert(res.duplicates ? "Duplicates removed!" : "No duplicates found.");
      router.refresh();
    } catch (err) {
      alert("Failed to remove duplicates");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className="relative inline-flex h-9 items-stretch"
      ref={menuRef}>
      {/* MAIN BUTTON */}
      <button
        onClick={handleRemove}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 rounded-l-full border text-xs font-bold tracking-widest uppercase transition-all ${
          isPending
            ? "border-gray-600 text-gray-600"
            : "border-[#b3b3b3] text-[#b3b3b3] hover:text-white hover:bg-white/5"
        }`}>
        {isPending ? "PROCESSING..." : "Remove Duplicates"}
      </button>

      {/* DROPDOWN TOGGLE */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center justify-center px-3 rounded-r-full border-y border-r border-l-0 text-[#b3b3b3] border-[#b3b3b3] hover:text-white hover:bg-white/5 transition-all">
        {/* Removed redundant padding, used flex-center and border-l-0 to avoid double borders */}
        <ChevronDown
          size={16}
          className={`transition-transform ${showMenu ? "rotate-180" : ""}`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {showMenu && (
        <div className="absolute top-full mt-2 right-0 w-56 bg-[#282828] border border-white/10 rounded shadow-xl z-50 py-1 animate-in fade-in zoom-in duration-100">
          <div className="px-3 py-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5">
            Album Priority
          </div>

          {[
            { id: "album", label: "Prefer Albums" },
            { id: "single", label: "Prefer Singles" },
            { id: "compilation", label: "Prefer Compilations" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                // Logic to move clicked item to front of priority array
                setPriority([
                  item.id,
                  ...priority.filter((p) => p !== item.id),
                ]);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors">
              {item.label}
              {priority[0] === item.id && (
                <Check
                  size={14}
                  className="text-green-500"
                />
              )}
            </button>
          ))}

          <div className="px-3 py-1.5 text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em]">
            Content Preference
          </div>
          <button
            onClick={() => setPrioNonexplicit(!prioNonexplicit)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-colors">
            <div className="flex flex-col items-start">
              <span>Prefer Clean Versions</span>
              <span className="text-[10px] text-zinc-500 italic">
                Avoids [Explicit] tags
              </span>
            </div>
            {/* Custom Toggle Switch */}
            <div
              className={`w-8 h-4 rounded-full relative transition-colors ${prioNonexplicit ? "bg-[#1DB954]" : "bg-zinc-600"}`}>
              <div
                className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${prioNonexplicit ? "left-4.5" : "left-0.5"}`}
              />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
