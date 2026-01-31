"use client";

import { useState, useEffect } from "react";
import { ApiTrack } from "@/types/api/tracks";
import TrackRow from "./TrackRow";

export default function TrackTable({ tracks }: { tracks: ApiTrack[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(true);

  const allSelected = selectedIds.size === tracks.length && tracks.length > 0;

  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tracks.map((t, i) => `${t.id}-${i}`)));
    }
  };

  const handleMouseDown = (idx: number, id: string) => {
    setIsDragging(true);
    setDragStartIdx(idx);
    const adding = !selectedIds.has(id);
    setIsSelecting(adding);

    // Save the current state so we can reference it during the drag
    setInitialSelectedIds(new Set(selectedIds));

    // Apply the first click
    setSelectedIds((prev) => {
      const next = new Set(prev);
      adding ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const updateRange = (currentIdx: number) => {
    if (dragStartIdx === null) return;

    const min = Math.min(dragStartIdx, currentIdx);
    const max = Math.max(dragStartIdx, currentIdx);

    // 1. Start with the IDs we had before the drag started
    const next = new Set(initialSelectedIds);

    // 2. Figure out which IDs are in the current drag rectangle
    const rangeIds = tracks
      .slice(min, max + 1)
      .map((t, i) => `${t.id}-${min + i}`);

    // 3. Apply the current action (selecting or deselecting)
    rangeIds.forEach((id) => {
      if (isSelecting) {
        next.add(id);
      } else {
        next.delete(id);
      }
    });

    setSelectedIds(next);
  };

  useEffect(() => {
    const stop = () => setIsDragging(false);
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. SELECTION CONTROLS (Restored here) */}
      <div className="flex items-center gap-4 py-2">
        <button
          onClick={toggleSelectAll}
          className="text-[10px] font-bold tracking-widest text-[#b3b3b3] hover:text-white uppercase border border-[#b3b3b3] px-3 py-1 rounded-full transition">
          {allSelected ? "Deselect All" : "Select All"}
        </button>

        {selectedIds.size > 0 && (
          <span className="text-sm font-bold text-[#1db954] animate-in fade-in duration-300">
            {selectedIds.size} Selected
          </span>
        )}
      </div>

      {/* 2. TABLE */}
      <table className="w-full text-left border-separate border-spacing-0 select-none">
        <thead>
          <tr className="text-[#b3b3b3] text-xs uppercase tracking-widest border-b border-white/10">
            <th className="p-4 font-normal w-12">#</th>
            <th className="p-4 font-normal">Title</th>
            <th className="p-4 font-normal hidden md:table-cell">Album</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, i) => {
            const uniqueId = `${track.id}-${i}`;
            return (
              <TrackRow
                key={uniqueId}
                track={track}
                index={i}
                isSelected={selectedIds.has(uniqueId)}
                onMouseDown={() => handleMouseDown(i, uniqueId)}
                onMouseEnter={() => isDragging && updateRange(i)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
