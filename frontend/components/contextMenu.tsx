"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  allSelected: boolean;
  onClose: () => void;
  toggleSelect: () => void;
  handleRemoveTags: (
    trackIds: string[],
    tags: string[] | "all",
  ) => Promise<void>;
  selectedIds: Set<string>;
}

export default function ContextMenu({
  x,
  y,
  onClose,
  toggleSelect,
  allSelected,
  handleRemoveTags,
  selectedIds,
}: ContextMenuProps) {
  useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener("click", handleClick);

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("click", handleClick);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const [showTagsSubMenu, setShowTagsSubMenu] = useState(false);

  return createPortal(
    <div
      className="fixed z-9999 w-48 bg-[#181818] border border-[#333] rounded-md shadow-xl py-1 text-sm text-white"
      style={{ top: y, left: x }}>
      {allSelected ? (
        <button
          onClick={toggleSelect}
          className="w-full text-left px-4 py-2 hover:bg-[#333] transition-colors text-red-400">
          Deselect All
        </button>
      ) : (
        <button
          onClick={toggleSelect}
          className="w-full text-left px-4 py-2 hover:bg-[#333] transition-colors">
          Select All
        </button>
      )}
      <button className="w-full text-left px-4 py-2 hover:bg-[#333] transition-colors">
        Enable Drag Select
      </button>
      <div
        className="relative"
        onMouseEnter={() => setShowTagsSubMenu(true)}
        onMouseLeave={() => setShowTagsSubMenu(false)}
        onClick={(e) => {
          e.stopPropagation();
        }}>
        <button className="w-full text-left px-4 py-2 hover:bg-[#333] flex justify-between items-center">
          <span>Remove Tags</span>
          <span>▶</span> {/* Arrow icon */}
        </button>

        {/* THE SUB-MENU */}
        {showTagsSubMenu && (
          <div className="absolute top-0 left-full w-48 bg-[#181818] border border-[#333] rounded-md shadow-xl py-2">
            <button
              onClick={() => handleRemoveTags(Array.from(selectedIds), "all")}
              className="w-full text-left px-4 py-2 hover:bg-[#333] text-red-400">
              Remove All Tags
            </button>
            <button
              onClick={() => handleRemoveTags(Array.from(selectedIds), "all")}
              className="w-full text-left px-4 py-2 hover:bg-[#333]">
              Select Specific Tags...
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => console.log("Add to Playlist")}
        className="w-full text-left px-4 py-2 hover:bg-[#333]">
        Add to Playlist...
      </button>
      <div className="h-px bg-[#333] my-1" />
      <button className="w-full text-left px-4 py-2 hover:bg-[#333] text-red-400">
        Cancel Selection
      </button>
    </div>,
    document.body,
  );
}
