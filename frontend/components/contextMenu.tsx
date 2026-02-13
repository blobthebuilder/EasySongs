"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, useMemo } from "react";
import TagSelector from "./TagSelector";
import RemoveTagsModal from "./RemoveTagsModal";
import { Tag } from "@/types/api/tags";

interface ContextMenuProps {
  x: number;
  y: number;
  allSelected: boolean;
  onClose: () => void;
  toggleSelect: () => void;
  // Note: Parent needs to provide the tags map to filter available tags
  tags: Record<string, Tag[]>;
  handleRemoveTags: (
    trackIds: string[],
    tags: number[] | "all",
  ) => Promise<void>;
  handleAddTag: (name: string, color: string) => Promise<void>;
  selectedIds: Set<string>;
  isRemoving: boolean;
  isTaggingLoading: boolean;
}

export default function ContextMenu({
  x,
  y,
  onClose,
  toggleSelect,
  allSelected,
  tags,
  handleRemoveTags,
  handleAddTag,
  selectedIds,
  isRemoving,
  isTaggingLoading,
}: ContextMenuProps) {
  const [showTagsSubMenu, setShowTagsSubMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "none" | "addTag" | "removeTag"
  >("none");

  // --- Logic to get unique tags for the current selection ---
  const tagsInSelection = useMemo(() => {
    const uniqueTags = new Map<number, Tag>();
    selectedIds.forEach((songId) => {
      const cleanId = songId.replace(/-(\d+)$/, ""); // Strip the index
      const songTags = tags[cleanId];
      if (songTags) {
        songTags.forEach((tag) => {
          if (!uniqueTags.has(tag.id)) uniqueTags.set(tag.id, tag);
        });
      }
    });
    return Array.from(uniqueTags.values());
  }, [selectedIds, tags]);

  // Handle closing when clicking outside
  useEffect(() => {
    const handleClick = () => {
      // Don't close if a modal is open, or it will kill the modal!
      if (activeModal === "none") onClose();
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [onClose, activeModal]);

  return createPortal(
    <>
      {/* MAIN CONTEXT MENU */}
      <div
        className="fixed z-9999 w-48 bg-[#181818] border border-[#333] rounded-md shadow-xl py-1 text-sm text-white"
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()} // Prevent clicking the menu from closing itself
      >
        <button
          onClick={toggleSelect}
          className={`w-full text-left px-4 py-2 hover:bg-[#333] transition-colors ${allSelected ? "text-red-400" : ""}`}>
          {allSelected ? "Deselect All" : "Select All"}
        </button>

        <button className="w-full text-left px-4 py-2 hover:bg-[#333] transition-colors">
          Enable Drag Select
        </button>

        <div
          className="relative"
          onMouseEnter={() => setShowTagsSubMenu(true)}
          onMouseLeave={() => setShowTagsSubMenu(false)}>
          <button className="w-full text-left px-4 py-2 hover:bg-[#333] flex justify-between items-center">
            <span>Edit Selection Tags</span>
            <span className="text-[10px] text-zinc-500">▶</span>
          </button>

          {showTagsSubMenu && (
            <div className="absolute top-0 left-full ml-1 w-52 bg-[#282828] border border-white/10 rounded-lg shadow-2xl py-1 z-10000">
              <button
                onClick={() => setActiveModal("addTag")}
                className="w-full text-left px-4 py-2 hover:bg-white/10 text-xs flex justify-between items-center">
                <span>Add New Tag</span>
                <span className="text-zinc-500">+</span>
              </button>

              <div className="h-px bg-white/5 my-1 mx-2" />

              <button
                onClick={() => setActiveModal("removeTag")}
                className="w-full text-left px-4 py-2 hover:bg-white/10 text-xs flex justify-between items-center">
                <span>Remove Specific...</span>
                <span className="text-zinc-500">🏷️</span>
              </button>

              <button
                onClick={() => handleRemoveTags(Array.from(selectedIds), "all")}
                className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 text-xs font-bold flex justify-between items-center">
                <span>Clear All Tags</span>
                <span className="opacity-50">🗑</span>
              </button>
            </div>
          )}
        </div>

        <button className="w-full text-left px-4 py-2 hover:bg-[#333]">
          Add to Playlist...
        </button>
        <div className="h-px bg-[#333] my-1" />
        <button
          onClick={onClose}
          className="w-full text-left px-4 py-2 hover:bg-[#333] text-red-400">
          Cancel Menu
        </button>
      </div>

      {/* MODAL OVERLAYS (Outside main menu div so they don't get clipped) */}
      {activeModal === "addTag" && (
        <div className="fixed inset-0 z-10001 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <TagSelector
            selectedCount={selectedIds.size}
            isTagging={isTaggingLoading}
            onCancel={() => setActiveModal("none")}
            onAddTag={async (name, color) => {
              await handleAddTag(name, color);
              setActiveModal("none");
            }}
          />
        </div>
      )}

      {activeModal === "removeTag" && (
        <div className="fixed inset-0 z-10001 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <RemoveTagsModal
            selectedIds={selectedIds}
            availableTags={tagsInSelection}
            isRemoving={isRemoving}
            onClose={() => setActiveModal("none")}
            onRemove={async (ids, tagIds) => {
              await handleRemoveTags(ids, tagIds);
              setActiveModal("none");
            }}
          />
        </div>
      )}
    </>,
    document.body,
  );
}
