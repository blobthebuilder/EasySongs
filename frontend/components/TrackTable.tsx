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
import TagSelector from "./TagSelector";
import ContextMenu from "./contextMenu";
import { removeTagsFromTracks } from "@/lib/api/removeTagsFromTracks";
import RemoveTagsModal from "./RemoveTagsModal";
import { Tag } from "@/types/api/tags";
import { useMemo } from "react";

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
  const router = useRouter();

  // selection variables
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(true);

  const allSelected = selectedIds.size === tracks.length && tracks.length > 0;
  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(
    new Set(),
  );

  // tag variables
  const [isTaggingMenuOpen, setIsTaggingMenuOpen] = useState(false);
  const [isTaggingLoading, setIsTaggingLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "none" | "addTag" | "removeTag" | "removeSongs"
  >("none");
  const [isRemoving, setIsRemoving] = useState(false);

  // copy to another playlist variables
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // right click menu
  const [menuConfig, setMenuConfig] = useState<{ x: number; y: number } | null>(
    null,
  );
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    const menuWidth = 200; // Approximate width of your menu
    const menuHeight = 250; // Approximate height of your menu

    let posX = e.clientX;
    let posY = e.clientY;

    // If clicking near the right edge, shift menu to the left
    if (posX + menuWidth > window.innerWidth) {
      posX = posX - menuWidth;
    }

    // If clicking near the bottom edge, shift menu upwards
    if (posY + menuHeight > window.innerHeight) {
      posY = posY - menuHeight;
    }

    setMenuConfig({ x: posX, y: posY });
  };

  const handleCopyTracks = async (targetId: string) => {
    const cleanIds = Array.from(selectedIds).map((id) => id.split("-")[0]);

    setIsCopying(true); // Start the spinner
    try {
      await addTracksToPlaylist(targetId, cleanIds);
      setShowPlaylistModal(false);
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

  const handleMouseDown = (e: React.MouseEvent, idx: number, id: string) => {
    if ((e.button !== 0 || e.ctrlKey) && selectedIds.has(id)) return;

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
      await removeTracksFromPlaylist(targetId, cleanIds);
      setSelectedIds(new Set());

      // 6. Refresh the view so the songs disappear
      router.refresh();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to remove songs. Please try again.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleAddTag = async (tagName: string, color: string) => {
    if (!tagName.trim() || selectedIds.size === 0) return;

    setIsTaggingLoading(true);
    try {
      // Clean IDs (strip the -index suffix)
      const cleanIds = Array.from(selectedIds).map((id) => id.split("-")[0]);

      await apiFetch(`/api/playlists/${playlistId}/tags`, {
        method: "POST",
        body: JSON.stringify({
          tagName: tagName.trim(),
          color: color, // New color field!
          trackIDs: cleanIds,
        }),
      });

      setIsTaggingMenuOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Tagging failed:", error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setIsTaggingLoading(false);
    }
  };

  const handleRemoveTags = async (
    trackIds: string[],
    tagIds: "all" | number[],
  ) => {
    try {
      // Determine what tag IDs to send to the backend
      // If 'all', we send an empty array
      const tagIdsToRemove = tagIds === "all" ? [] : tagIds;
      setIsRemoving(true);
      await removeTagsFromTracks(playlistId, trackIds, tagIdsToRemove);

      setMenuConfig(null);
      router.refresh();
      alert("Tags removed successfully!");
    } catch (error) {
      console.error("Failed to remove tags:", error);
    } finally {
      setIsRemoving(false);
      setActiveModal("none");
    }
  };

  const openTool = (tool: "addTag" | "removeTag" | "removeSongs") => {
    setActiveModal(tool);
    setIsTaggingMenuOpen(false); // Close the dropdown menu
  };

  const tagsInSelection = useMemo(() => {
    const uniqueTags = new Map<number, Tag>();

    selectedIds.forEach((songId) => {
      // Strip the "-ind" suffix to match the key in your tags object
      const cleanId = songId.replace(/-(\d+)$/, "");

      const songTags = tags[cleanId];

      if (songTags) {
        songTags.forEach((tag) => {
          if (!uniqueTags.has(tag.id)) {
            uniqueTags.set(tag.id, tag);
          }
        });
      }
    });

    return Array.from(uniqueTags.values());
  }, [selectedIds, tags]);

  useEffect(() => {
    const stop = () => setIsDragging(false);
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  return (
    <div
      className="flex flex-col gap-4"
      onContextMenu={(e) => handleContextMenu(e)}>
      {menuConfig && (
        <ContextMenu
          x={menuConfig.x}
          y={menuConfig.y}
          onClose={() => setMenuConfig(null)}
          selectedIds={selectedIds}
          allSelected={allSelected}
          toggleSelect={toggleSelectAll}
          tags={tags}
          handleRemoveTags={handleRemoveTags}
          handleAddTag={handleAddTag}
          isRemoving={isRemoving}
          isTaggingLoading={isTaggingLoading}
        />
      )}
      {/* 1. SELECTION CONTROLS */}
      <div className="flex items-center gap-4 py-2 min-h-10">
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
          className={`flex items-center gap-4 transition-opacity duration-200`}>
          <div className="h-4 w-px bg-white/10" />

          <span className="text-sm font-bold text-[#1db954] whitespace-nowrap">
            {selectedIds.size} Selected
          </span>

          {/* TAGGING UI */}
          <div className="relative">
            <button
              onClick={() => setIsTaggingMenuOpen(!isTaggingMenuOpen)}
              className="text-[10px] font-bold tracking-widest text-white bg-[#1DB954]/20 border border-[#1DB954]/40 hover:bg-[#1DB954]/30 uppercase px-4 py-1.5 rounded-full transition">
              Edit Tags
            </button>

            {isTaggingMenuOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-[#282828] border border-white/10 rounded-xl shadow-2xl p-1 z-50">
                <button
                  onClick={() => openTool("addTag")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-white hover:bg-white/10 rounded-lg transition">
                  Add New Tag <span className="text-zinc-500">+</span>
                </button>
                <button
                  onClick={() => openTool("removeTag")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-white hover:bg-white/10 rounded-lg transition">
                  Remove Tags <span className="text-zinc-500">−</span>
                </button>
              </div>
            )}
          </div>

          {/*Tagging modals*/}
          {activeModal === "addTag" && (
            <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <TagSelector
                selectedCount={selectedIds.size}
                isTagging={isTaggingLoading}
                onCancel={() => setActiveModal("none")}
                onAddTag={(name, color) => {
                  handleAddTag(name, color);
                  setActiveModal("none");
                }}
              />
            </div>
          )}

          {activeModal === "removeTag" && (
            <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <RemoveTagsModal
                selectedIds={selectedIds}
                onClose={() => setActiveModal("none")}
                onRemove={handleRemoveTags}
                isRemoving={isRemoving}
                availableTags={tagsInSelection}
              />
            </div>
          )}
          <button
            onClick={() => setShowPlaylistModal(true)}
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
                onMouseDown={(e) => handleMouseDown(e, i, uniqueId)}
                onMouseEnter={() => isDragging && updateRange(i)}
                trackTags={tags?.[track.id] || []}
              />
            );
          })}
        </tbody>
      </table>

      {showPlaylistModal && (
        <AddToPlaylistModal
          playlists={userPlaylists}
          onClose={() => !isCopying && setShowPlaylistModal(false)} // Prevent closing while busy
          onSelect={handleCopyTracks} // This now triggers the API call
        />
      )}
    </div>
  );
}
