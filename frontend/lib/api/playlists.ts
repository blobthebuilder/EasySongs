import {
  ApiPlaylist,
  RemoveDuplicatesPlaylistResponse,
} from "@/types/api/playlists";
import { apiFetch } from "./fetch";

export async function fetchPlaylists(): Promise<ApiPlaylist[]> {
  return apiFetch("/api/playlists");
}

export async function removeDuplicatesPlaylists(
  playlistId: string,
  snapshotId: string,
): Promise<RemoveDuplicatesPlaylistResponse> {
  return apiFetch(`/api/playlists/${playlistId}/remove-duplicates`, {
    method: "POST",
    body: JSON.stringify({ snapshotId }),
  });
}
