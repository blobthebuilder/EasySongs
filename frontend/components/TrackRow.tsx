import { Tag } from "@/types/api/tags";
import { ApiTrack } from "@/types/api/tracks";

interface TrackRowProps {
  track: ApiTrack;
  index: number;
  isSelected: boolean;
  onMouseDown: () => void;
  onMouseEnter: () => void;
  trackTags: Tag[];
}

export default function TrackRow({
  track,
  index,
  isSelected,
  onMouseDown,
  onMouseEnter,
  trackTags,
}: TrackRowProps) {
  return (
    <tr
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={`group transition-colors relative ${
        isSelected ? "bg-white/20" : "hover:bg-white/10"
      }`}>
      <td className="p-4 text-[#b3b3b3] text-sm w-12">
        <div className="w-8 flex items-center justify-center">
          {isSelected ? (
            <span className="text-[#1db954] font-bold">✓</span>
          ) : (
            <span className="tabular-nums">{index + 1}</span>
          )}
        </div>
      </td>
      <td className="p-4">
        <div
          className={`font-medium truncate max-w-md ${isSelected ? "text-[#1db954]" : "text-white"}`}>
          {track.name}
        </div>
        <div className="text-sm text-[#b3b3b3] group-hover:text-white truncate max-w-md mb-1">
          {track.artists.map((a) => a.name).join(", ")}
        </div>

        {/* TAGS USING DYNAMIC COLOR WITH FALLBACK */}
        {trackTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trackTags.map((tag) => {
              // Define a fallback color if tag.color is null/undefined
              const displayColor = tag.color || "#b3b3b3";

              return (
                <span
                  key={tag.id}
                  style={{
                    borderColor: `${displayColor}66`, // 40% opacity border
                    color: displayColor, // Solid text color
                    backgroundColor: `${displayColor}15`, // ~8% opacity background
                  }}
                  className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border transition-all">
                  {tag.name}
                </span>
              );
            })}
          </div>
        )}
      </td>

      <td className="p-4 text-sm text-[#b3b3b3] hidden md:table-cell">
        {track.album?.name || "Single"}
      </td>
    </tr>
  );
}
