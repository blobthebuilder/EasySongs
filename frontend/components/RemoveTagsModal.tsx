import React, { useState } from "react";
import { X, Trash2, Check } from "lucide-react"; // Added Check icon
import { Tag } from "@/types/api/tags";

interface RemoveTagsModalProps {
  selectedIds: Set<string>;
  availableTags: Tag[];
  onClose: () => void;
  onRemove: (trackIds: string[], tags: number[] | "all") => Promise<void>;
  isRemoving: boolean;
}

const RemoveTagsModal: React.FC<RemoveTagsModalProps> = ({
  selectedIds,
  availableTags,
  onClose,
  onRemove,
  isRemoving,
}) => {
  const [tagsToRemove, setTagsToRemove] = useState<Set<number>>(new Set());

  const toggleTagSelection = (tagId: number) => {
    const newSet = new Set(tagsToRemove);
    if (newSet.has(tagId)) {
      newSet.delete(tagId);
    } else {
      newSet.add(tagId);
    }
    setTagsToRemove(newSet);
  };

  const handleBatchRemove = () => {
    if (tagsToRemove.size === 0) return;
    // Convert IDs to strings to match your API signature
    const tagIdsArray = Array.from(tagsToRemove).map((id) => id);
    onRemove(Array.from(selectedIds), tagIdsArray);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#282828] border border-white/10 rounded-xl animate-in fade-in zoom-in-95 shadow-2xl w-72 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
            Remove Tags
          </span>
          <span className="text-[11px] text-zinc-400">
            {selectedIds.size} {selectedIds.size === 1 ? "song" : "songs"}{" "}
            selected
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
        {/* Bulk Action: Quick Clear */}
        <button
          disabled={isRemoving}
          onClick={() => onRemove(Array.from(selectedIds), "all")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-left group">
          <div className="p-1.5 bg-red-500/20 rounded-md group-hover:bg-red-500/30">
            <Trash2 size={14} />
          </div>
          <span className="text-xs font-bold">Clear All Tags</span>
        </button>

        <div className="h-px bg-white/5 my-1" />

        <span className="px-3 py-1 text-[10px] text-zinc-500 uppercase font-bold">
          Select Tags to Remove
        </span>

        {availableTags.length > 0 ? (
          availableTags.map((tag) => {
            const isSelected = tagsToRemove.has(tag.id);
            return (
              <button
                key={tag.id}
                disabled={isRemoving}
                onClick={() => toggleTagSelection(tag.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left group border ${
                  isSelected
                    ? "bg-red-500/10 border-red-500/30"
                    : "hover:bg-white/5 border-transparent"
                }`}>
                <div
                  className="w-3 h-3 rounded-full border border-white/10"
                  style={{ backgroundColor: tag.color }}
                />
                <span
                  className={`text-xs flex-1 ${isSelected ? "text-white" : "text-zinc-300"}`}>
                  {tag.name}
                </span>
                {/* Custom Checkbox UI */}
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-red-500 border-red-500"
                      : "border-white/20 group-hover:border-white/40"
                  }`}>
                  {isSelected && (
                    <Check
                      size={10}
                      strokeWidth={4}
                    />
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-4 text-center text-xs text-zinc-500 italic">
            No tags found in selection
          </div>
        )}
      </div>

      {/* THE BATCH ACTION BUTTON */}
      <button
        disabled={isRemoving || tagsToRemove.size === 0}
        onClick={handleBatchRemove}
        className="mt-2 w-full bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-lg transition-all active:scale-95 shadow-lg">
        {isRemoving
          ? "Removing..."
          : `Remove ${tagsToRemove.size} Selected Tags`}
      </button>

      {isRemoving && (
        <div className="text-[10px] text-center text-[#1DB954] animate-pulse font-bold">
          Updating tracks...
        </div>
      )}
    </div>
  );
};

export default RemoveTagsModal;
