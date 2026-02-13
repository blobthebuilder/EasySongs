import React, { useState, useRef, FormEvent } from "react";
import ModalFrame from "./ModalFrame";

interface TagSelectorProps {
  onAddTag: (name: string, color: string) => void;
  onCancel: () => void;
  isBusy: boolean;
  selectedCount: number;
}

const PRESET_COLORS: string[] = [
  "#1DB954",
  "#509BF5",
  "#EB1E32",
  "#F59B23",
  "#B023F5",
  "#FF69B4",
];

const TagSelector: React.FC<TagSelectorProps> = ({
  onAddTag,
  onCancel,
  isBusy,
  selectedCount,
}) => {
  const [tagName, setTagName] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]);

  // Explicitly type the ref for the HTML Input element
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    onAddTag(tagName, selectedColor);
    setTagName("");
  };

  return (
    <ModalFrame
      title="Add New Tag"
      subtitle={`Tagging ${selectedCount} ${selectedCount === 1 ? "Song" : "Songs"}`}
      onClose={onCancel} // The frame's close button now triggers the parent's onClose
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={tagName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTagName(e.target.value)
            }
            placeholder="Gym, Chill, Focus..."
            className="bg-[#181818] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954] w-full"
          />
          <button
            type="submit"
            disabled={isBusy || !tagName}
            className="text-xs font-bold text-[#1DB954] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed">
            {isBusy ? "..." : "ADD"}
          </button>
        </div>
      </form>

      {/* COLOR PICKER SECTION */}
      <div className="flex flex-col gap-2 border-t border-white/5 pt-2">
        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
          Label Color
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-5 h-5 rounded-full transition-all border-2 ${
                selectedColor === color
                  ? "border-white scale-110 shadow-lg"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}

          {/* CUSTOM COLOR WHEEL */}
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            title="Custom Color"
            className="w-5 h-5 rounded-full bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] hover:rotate-90 transition-transform duration-500 border border-white/10"
          />
          <input
            ref={colorInputRef}
            type="color"
            value={selectedColor}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSelectedColor(e.target.value)
            }
            className="sr-only"
          />
        </div>
      </div>
    </ModalFrame>
  );
};

export default TagSelector;
