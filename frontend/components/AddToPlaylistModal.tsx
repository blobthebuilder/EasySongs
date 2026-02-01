"use client";

import { ApiPlaylist } from "@/types/api/playlists";

export default function AddToPlaylistModal({
  playlists,
  onSelect,
  onClose,
}: {
  playlists: ApiPlaylist[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    // Backdrop: Higher blur and slightly darker to focus on the modal
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-100 flex items-center justify-center p-4">
      {/* Modal Container: Using a deeper black for the container to pop against the backdrop */}
      <div
        className="bg-[#181818] w-full max-w-md rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}>
        {/* Header: Pure white text for primary focus */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-bold text-xl text-white tracking-tight">
            Add to Playlist
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <line
                x1="18"
                y1="6"
                x2="6"
                y2="18"></line>
              <line
                x1="6"
                y1="6"
                x2="18"
                y2="18"></line>
            </svg>
          </button>
        </div>

        {/* List Area: Slightly lighter background than the container to create depth */}
        <div className="overflow-y-auto p-2 bg-[#121212]/50">
          <button
            onClick={() => onSelect("liked-songs")}
            className="w-full flex items-center gap-4 p-3 hover:bg-[#2a2a2a] rounded-md transition-all group text-left border-b border-white/5 mb-1">
            <div className="w-12 h-12 bg-linear-to-br from-[#450af5] to-[#c4efd9] rounded shadow-lg shrink-0 flex items-center justify-center border border-white/5">
              <span className="text-white text-xl">♥</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white text-[15px] truncate group-hover:text-green-500 transition-colors">
                Liked Songs
              </span>
              <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider mt-0.5">
                Auto-save to Library
              </span>
            </div>
          </button>
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelect(pl.id)}
              className="w-full flex items-center gap-4 p-3 hover:bg-[#2a2a2a] rounded-md transition-all group text-left">
              {/* Image Thumbnail with a subtle border */}
              <div className="w-12 h-12 bg-[#282828] rounded shadow-lg shrink-0 flex items-center justify-center border border-white/5 overflow-hidden">
                {pl.images?.[0] ? (
                  <img
                    src={pl.images[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">💿</span>
                )}
              </div>

              {/* Text Container */}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-[15px] truncate group-hover:text-green-500 transition-colors">
                  {pl.name}
                </span>
                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider mt-0.5">
                  Playlist • {pl.tracks?.total || 0} tracks
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer: Optional visual weight */}
        <div className="p-3 border-t border-white/10 text-center">
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
