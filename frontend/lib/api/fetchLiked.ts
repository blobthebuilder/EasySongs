import { ApiTrack, TrackDetails } from "@/types/api/tracks";
import { apiFetchServer } from "./fetchServer";

export async function fetchLikedSongs(): Promise<ApiTrack[]> {
  return apiFetchServer("/api/liked");
}

export async function fetchLikedSongsDetails(): Promise<TrackDetails> {
  return apiFetchServer("/api/liked/details");
}
