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
import ModalShell from "./ModalShell";
import BeanButton from "./BeanButton";
import { useRef } from "react";

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
  const [activeModal, setActiveModal] = useState<
    "none" | "addTag" | "removeTag" | "copyToPlaylist"
  >("none");

  // processing variable
  const [isBusy, setIsBusy] = useState(false);

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

  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setIsTaggingMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCopyTracks = async (targetId: string) => {
    const cleanIds = Array.from(selectedIds).map((id) => id.split("-")[0]);

    setIsBusy(true);
    try {
      await addTracksToPlaylist(targetId, cleanIds);
      setActiveModal("none");
      setSelectedIds(new Set());
      alert("Songs copied successfully!");
    } catch (err) {
      console.log(err);
      alert("Failed to copy songs.");
    } finally {
      setIsBusy(false);
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

    setIsBusy(true);
    try {
      await removeTracksFromPlaylist(targetId, cleanIds);
      setSelectedIds(new Set());

      // 6. Refresh the view so the songs disappear
      router.refresh();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to remove songs. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleAddTag = async (tagName: string, color: string) => {
    if (!tagName.trim() || selectedIds.size === 0) return;

    setIsBusy(true);
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
      setIsBusy(false);
    }
  };

  const handleRemoveTags = async (
    trackIds: string[],
    tagIds: "all" | number[],
  ) => {
    try {
      const tagIdsToRemove = tagIds === "all" ? [] : tagIds;
      setIsBusy(true);
      await removeTagsFromTracks(playlistId, trackIds, tagIdsToRemove);

      setMenuConfig(null);
      router.refresh();
      alert("Tags removed successfully!");
    } catch (error) {
      console.error("Failed to remove tags:", error);
    } finally {
      setIsBusy(false);
      setActiveModal("none");
    }
  };

  const openTool = (tool: "addTag" | "removeTag") => {
    setActiveModal(tool);
    setIsTaggingMenuOpen(false);
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

  // Handle global mouse up to stop dragging
  useEffect(() => {
    const stopDragging = () => setIsDragging(false);

    window.addEventListener("mouseup", stopDragging);
    return () => window.removeEventListener("mouseup", stopDragging);
  }, []);

  return (
    <div
      className="flex flex-col gap-4"
      onContextMenu={(e) => handleContextMenu(e)}>
      {/*context menu and modals*/}
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
          isBusy={isBusy}
        />
      )}
      {activeModal !== "none" && (
        <ModalShell onClose={() => setActiveModal("none")}>
          {activeModal === "addTag" && (
            <TagSelector
              selectedCount={selectedIds.size}
              isBusy={isBusy}
              onCancel={() => setActiveModal("none")}
              onAddTag={(name, color) => {
                handleAddTag(name, color);
                setActiveModal("none");
              }}
            />
          )}
          {activeModal === "removeTag" && (
            <RemoveTagsModal
              selectedIds={selectedIds}
              onClose={() => setActiveModal("none")}
              onRemove={handleRemoveTags}
              isBusy={isBusy}
              availableTags={tagsInSelection}
            />
          )}
          {activeModal === "copyToPlaylist" && (
            <AddToPlaylistModal
              playlists={userPlaylists}
              onClose={() => !isBusy && setActiveModal("none")} // Prevent closing while busy
              onSelect={handleCopyTracks} // This now triggers the API call
            />
          )}
        </ModalShell>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-4">
        <BeanButton
          onClick={toggleSelectAll}
          variant={allSelected ? "danger" : "primary"}
          className="w-32">
          {allSelected ? "Deselect All" : "Select All"}
        </BeanButton>

        <div className="h-4 w-px bg-white/10" />

        <span className="text-sm font-bold text-[#1db954] whitespace-nowrap w-24 flex items-center justify-center">
          {selectedIds.size} Selected
        </span>

        {/* TAGGING UI */}
        <div
          className="relative"
          ref={menuRef}>
          <BeanButton
            disabled={selectedIds.size === 0 || isBusy}
            onClick={() => setIsTaggingMenuOpen(!isTaggingMenuOpen)}
            variant="secondary"
            className="bg-[#1DB954]/20 border-[#1DB954]/40 text-[#1DB954] hover:bg-[#1DB954]/30">
            Edit Tags
          </BeanButton>
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

        {/* ADD BEAN */}
        <BeanButton
          onClick={() => setActiveModal("copyToPlaylist")}
          disabled={isBusy || selectedIds.size === 0}
          variant="secondary">
          {isBusy ? "Copying..." : "Add to Playlist"}
        </BeanButton>
        {/* REMOVE BEAN */}
        <BeanButton
          onClick={handleRemoveTracks}
          disabled={isBusy || selectedIds.size === 0}
          variant="danger">
          {isBusy ? "Removing..." : "Remove from Playlist"}
        </BeanButton>
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
    </div>
  );
}
