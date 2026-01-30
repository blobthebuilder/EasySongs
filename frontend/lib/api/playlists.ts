import {
  ApiPlaylist,
  RemoveDuplicatesRequest,
  RemoveDuplicatesPlaylistResponse,
} from "@/types/api/playlists";
import { apiFetchServer } from "./fetchServer";
import { ApiTrack } from "@/types/api/tracks";

export async function fetchPlaylists(): Promise<ApiPlaylist[]> {
  return apiFetchServer("/api/playlists");
}

export async function fetchPlaylistTracks(
  playlistId: string,
): Promise<ApiTrack[]> {
  return apiFetchServer(`/api/playlists/${playlistId}/tracks`);
}
