"use client";

import { ApiPlaylist } from "@/types/api/playlists";
import ModalFrame from "./ModalFrame";

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
    <ModalFrame
      title="Add to Playlist"
      subtitle="Select a destination"
      onClose={onClose}>
      <div className="flex flex-col max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
        {/* LIKED SONGS OPTION */}
        <button
          onClick={() => onSelect("liked-songs")}
          className="w-full flex items-center gap-4 p-3 hover:bg-white/10 rounded-lg transition-all group text-left border-b border-white/5 mb-1">
          <div className="w-12 h-12 bg-linear-to-br from-[#450af5] to-[#c4efd9] rounded shadow-lg shrink-0 flex items-center justify-center border border-white/5">
            <span className="text-white text-xl">♥</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-white text-[15px] truncate group-hover:text-[#1DB954] transition-colors">
              Liked Songs
            </span>
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
              Auto-save to Library
            </span>
          </div>
        </button>

        {/* PLAYLIST LIST */}
        <div className="flex flex-col gap-1">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelect(pl.id)}
              className="w-full flex items-center gap-4 p-3 hover:bg-white/10 rounded-lg transition-all group text-left">
              <div className="w-12 h-12 bg-[#181818] rounded shadow-md shrink-0 flex items-center justify-center border border-white/5 overflow-hidden">
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

              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-[15px] truncate group-hover:text-[#1DB954] transition-colors">
                  {pl.name}
                </span>
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Playlist • {pl.tracks?.total || 0} tracks
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ModalFrame>
  );
}
