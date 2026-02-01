import { apiFetch } from "./fetch";
export async function removeTracksFromPlaylist(
  targetId: string,
  trackIds: string[],
) {
  return apiFetch(`/api/playlists/${targetId}/tracks`, {
    method: "DELETE",
    body: JSON.stringify({ track_ids: trackIds }),
  });
}
