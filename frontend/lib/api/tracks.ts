import { ApiTrack } from "@/types/api/tracks";
import { apiFetch } from "./fetch";

export async function fetchPlaylistTracks(
  playlistId: string,
): Promise<ApiTrack[]> {
  return apiFetch(`/api/playlists/${playlistId}/tracks`);
}
