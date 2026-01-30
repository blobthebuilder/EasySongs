export type ApiPlaylist = {
  id: string;
  name: string;
  snapshot_id: string;
};

export interface RemoveDuplicatesRequest {
  albumTypePriority?: string[]; // optional
  prioNonexplicit?: boolean | null; // optional
}

export type RemoveDuplicatesPlaylistResponse = {
  snapshotId: string;
  duplicates: boolean;
};
