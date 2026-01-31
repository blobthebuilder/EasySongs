import { ApiTrack } from "./tracks";

export type ApiPlaylist = {
  id: string;
  name: string;
  snapshot_id: string;
  images: ImageObject[];
};

export type ImageObject = {
  url: string;
  height: number | null;
  width: number | null;
};

export interface RemoveDuplicatesRequest {
  albumTypePriority?: string[]; // optional
  prioNonexplicit?: boolean | null; // optional
}

export type RemoveDuplicatesPlaylistResponse = {
  snapshotId: string;
  duplicates: boolean;
};

export type PlaylistDetails = {
  id: string;
  name: string;
  snapshot_id: string;
  images: ImageObject[];
  description: string;
  tracks: ApiTrack[];
};
