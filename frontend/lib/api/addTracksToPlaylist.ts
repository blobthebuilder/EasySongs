import { apiFetch } from "./fetch";

export async function addTracksToPlaylist(
  playlistId: string,
  trackIds: string[],
) {
  return await apiFetch(`/api/playlists/${playlistId}/tracks`, {
    method: "POST",
    body: JSON.stringify({ track_ids: trackIds }),
  });
}
