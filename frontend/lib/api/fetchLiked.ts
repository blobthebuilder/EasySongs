import { ApiTrack } from "@/types/api/tracks";
import { apiFetchServer } from "./fetchServer";

export async function fetchLikedSongs(): Promise<ApiTrack[]> {
  return apiFetchServer("/api/liked");
}
