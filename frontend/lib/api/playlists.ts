import { ApiPlaylist } from "@/types/api/playlists";
import { apiFetchServer } from "./fetchServer";
import { ApiTrack } from "@/types/api/tracks";
import { PlaylistDetails } from "@/types/api/playlists";

// all server fetchs

export async function fetchPlaylists(): Promise<ApiPlaylist[]> {
  return apiFetchServer("/api/playlists");
}

export async function fetchPlaylistTracks(
  playlistId: string,
): Promise<ApiTrack[]> {
  return apiFetchServer(`/api/playlists/${playlistId}/tracks`);
}

export async function fetchPlaylistDetails(
  playlistId: string,
): Promise<PlaylistDetails> {
  return apiFetchServer(`/api/playlists/${playlistId}/details`);
}
