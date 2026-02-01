import { ApiTrack } from "@/types/api/tracks";

interface TrackRowProps {
  track: ApiTrack;
  index: number;
  isSelected: boolean;
  onMouseDown: () => void;
  onMouseEnter: () => void;
}

export default function TrackRow({
  track,
  index,
  isSelected,
  onMouseDown,
  onMouseEnter,
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
        <div className="text-sm text-[#b3b3b3] group-hover:text-white truncate max-w-md">
          {track.artists.map((a) => a.name).join(", ")}
        </div>
      </td>

      <td className="p-4 text-sm text-[#b3b3b3] hidden md:table-cell">
        {track.album?.name || "Single"}
      </td>
    </tr>
  );
}
