import { apiFetch } from "./fetch";

export async function addPlaylistToLiked(playlistId: string) {
  return apiFetch(`/api/playlists/${playlistId}/copy-to-liked`, {
    method: "POST",
  });
}
