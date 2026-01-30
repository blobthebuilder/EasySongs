import { ApiTrack } from "@/types/api/tracks";
import { apiFetchServer } from "./fetchServer";

export async function fetchPlaylistTracks(
  playlistId: string,
): Promise<ApiTrack[]> {
  return apiFetchServer(`/api/playlists/${playlistId}/tracks`);
}
