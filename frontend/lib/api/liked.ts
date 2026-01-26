import { ApiTrack } from "@/types/api/tracks";
import { apiFetch } from "./fetch";

export async function fetchLikedSongs(): Promise<ApiTrack[]> {
  return apiFetch("/api/liked");
}

export async function addPlaylistToLiked(playlistId: string) {
  return apiFetch(`/api/playlists/${playlistId}/copy-to-liked`, {
    method: "POST",
  });
}
