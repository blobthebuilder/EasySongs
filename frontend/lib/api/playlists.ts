import {
  ApiPlaylist,
  RemoveDuplicatesRequest,
  RemoveDuplicatesPlaylistResponse,
} from "@/types/api/playlists";
import { apiFetchServer } from "./fetchServer";

export async function fetchPlaylists(): Promise<ApiPlaylist[]> {
  return apiFetchServer("/api/playlists");
}

export async function removeDuplicatesPlaylists(
  playlistId: string,
  body: RemoveDuplicatesRequest,
): Promise<RemoveDuplicatesPlaylistResponse> {
  return apiFetchServer(`/api/playlists/${playlistId}/remove-duplicates`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
