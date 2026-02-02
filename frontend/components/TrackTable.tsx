"use client";

import { useState, useEffect } from "react";
import { ApiTrack } from "@/types/api/tracks";
import { ApiPlaylist } from "@/types/api/playlists";
import TrackRow from "./TrackRow";
import AddToPlaylistModal from "./AddToPlaylistModal";
import { addTracksToPlaylist } from "@/lib/api/addTracksToPlaylist";
import { removeTracksFromPlaylist } from "@/lib/api/removeTracksFromPlaylist";
import { apiFetch } from "@/lib/api/fetch";
import { useRouter } from "next/navigation";
import { TagsMap } from "@/types/api/tags";

export default function TrackTable({
  tracks,
  userPlaylists,
  tags,
  playlistId,
}: {
  tracks: ApiTrack[];
  userPlaylists: ApiPlaylist[];
  tags: TagsMap;
  playlistId: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(true);

  const allSelected = selectedIds.size === tracks.length && tracks.length > 0;

  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(
    new Set(),
  );

  const [showModal, setShowModal] = useState(false);

  const [isCopying, setIsCopying] = useState(false);

  const router = useRouter();

  const handleCopyTracks = async (targetId: string) => {
    const cleanIds = Array.from(selectedIds).map((id) => id.split("-")[0]);

    setIsCopying(true); // Start the spinner
    try {
      await addTracksToPlaylist(targetId, cleanIds);
      setShowModal(false);
      setSelectedIds(new Set());
      alert("Songs copied successfully!");
    } catch (err) {
      console.log(err);
      alert("Failed to copy songs.");
    } finally {
      setIsCopying(false); // Stop the spinner
    }
  };

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

  const handleRemoveTracks = async () => {
    // 1. Safety check: Don't do anything if no tracks are selected
    if (selectedIds.size === 0) return;

    const confirmMessage = `Remove ${selectedIds.size} songs from this playlist?`;
    if (!window.confirm(confirmMessage)) return;

    // 3. Prepare IDs (removing the -index suffix we added for unique keys)
    const cleanIds = Array.from(selectedIds).map((id) => id.split("-")[0]);

    const targetId = playlistId;

    setIsCopying(true);
    try {
      // 4. Call your new DELETE endpoint
      await removeTracksFromPlaylist(targetId, cleanIds);

      // 5. Update UI: Clear selection
      setSelectedIds(new Set());

      // 6. Refresh the view so the songs disappear
      // If you're using Next.js App Router, this is the cleanest way:
      window.location.reload();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to remove songs. Please try again.");
    } finally {
      setIsCopying(false);
    }
  };

  const [tagName, setTagName] = useState("");
  const [isTagging, setIsTagging] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Ensure we have a tag name and at least one song selected
    if (!tagName.trim() || selectedIds.size === 0) return;

    setIsTagging(true);
    try {
      // Using your apiFetch helper
      await apiFetch(`/api/playlists/${playlistId}/tags`, {
        method: "POST",
        body: JSON.stringify({
          tagName: tagName.trim(),
          trackIDs: Array.from(selectedIds), // Matches your Go []string struct
        }),
      });

      // Reset UI on success
      setTagName("");
      setShowTagInput(false);

      router.refresh();
    } catch (error: any) {
      console.error("Tagging failed:", error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setIsTagging(false);
    }
  };

  useEffect(() => {
    const stop = () => setIsDragging(false);
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. SELECTION CONTROLS */}
      <div className="flex items-center gap-4 py-2 min-h-10">
        {" "}
        {/* Fixed height prevents vertical jump */}
        <button
          onClick={toggleSelectAll}
          className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full transition-all shrink-0 border flex items-center justify-center w-31.25
    ${
      allSelected
        ? "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700"
        : "bg-[#1DB954] text-black border-[#1DB954] hover:bg-[#1ed760] hover:scale-105"
    }`}>
          {allSelected ? "Deselect All" : "Select All"}
        </button>
        {/* Wrap the dynamic content in a container that maintains height and handles transitions */}
        <div
          className={`flex items-center gap-4 transition-opacity duration-200 ${selectedIds.size > 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="h-4 w-px bg-white/10" />

          <span className="text-sm font-bold text-[#1db954] whitespace-nowrap">
            {selectedIds.size} Selected
          </span>

          {/* TAGGING UI */}
          {!showTagInput ? (
            <button
              onClick={() => setShowTagInput(true)}
              className="text-[10px] font-bold tracking-widest text-white bg-[#1DB954]/20 border border-[#1DB954]/40 hover:bg-[#1DB954]/30 uppercase px-4 py-1.5 rounded-full transition">
              Tag Songs
            </button>
          ) : (
            <form
              onSubmit={handleTagSubmit}
              className="flex items-center gap-2 animate-in slide-in-from-left-2">
              <input
                autoFocus
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Tag Name (e.g. Gym)"
                className="bg-[#282828] border border-white/10 rounded-full px-3 py-1 text-[10px] text-white focus:outline-none focus:border-[#1DB954] w-32"
              />
              <button
                type="submit"
                disabled={isTagging}
                className="text-[10px] font-bold text-[#1DB954] hover:text-white">
                {isTagging ? "..." : "ADD"}
              </button>
              <button
                type="button"
                onClick={() => setShowTagInput(false)}
                className="text-[10px] font-bold text-zinc-500 hover:text-white">
                ESC
              </button>
            </form>
          )}

          <button
            onClick={() => setShowModal(true)}
            disabled={isCopying}
            className="text-[10px] font-bold tracking-widest text-white bg-white/10 hover:bg-white/20 uppercase px-4 py-1.5 rounded-full transition whitespace-nowrap">
            {isCopying ? "Copying..." : "Add to Playlist"}
          </button>

          <button
            onClick={handleRemoveTracks}
            disabled={isCopying}
            className="text-[10px] font-bold tracking-widest text-zinc-500 hover:text-red-500 uppercase px-4 py-1.5 border border-zinc-800 hover:border-red-500/50 rounded-full transition">
            {isCopying ? "Removing..." : "Remove from Playlist"}
          </button>
        </div>
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
                trackTags={tags?.[track.id] || []}
              />
            );
          })}
        </tbody>
      </table>

      {showModal && (
        <AddToPlaylistModal
          playlists={userPlaylists}
          onClose={() => !isCopying && setShowModal(false)} // Prevent closing while busy
          onSelect={handleCopyTracks} // This now triggers the API call
        />
      )}
    </div>
  );
}
