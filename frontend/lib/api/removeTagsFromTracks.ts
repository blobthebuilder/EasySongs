import { apiFetch } from "./fetch";

export async function removeTagsFromTracks(
  playlistId: string,
  trackIds: string[],
  tagIds?: string[], // Optional: if undefined/empty, the backend removes ALL tags
) {
  return await apiFetch(`/api/playlists/${playlistId}/tags`, {
    method: "DELETE",
    body: JSON.stringify({
      trackIds,
      tagIds: tagIds || [], // Sending empty array signals "remove everything"
    }),
  });
}
