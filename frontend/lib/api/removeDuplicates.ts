import {
  RemoveDuplicatesPlaylistResponse,
  RemoveDuplicatesRequest,
} from "@/types/api/playlists";
import { apiFetch } from "./fetch";

export async function removeDuplicatesPlaylists(
  playlistId: string,
  body: RemoveDuplicatesRequest,
): Promise<RemoveDuplicatesPlaylistResponse> {
  return apiFetch(`/api/playlists/${playlistId}/remove-duplicates`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
