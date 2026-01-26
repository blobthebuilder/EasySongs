export type ApiPlaylist = {
  id: string;
  name: string;
  snapshot_id: string;
};

export type RemoveDuplicatesPlaylistResponse = {
  snapshotId: string;
  duplicates: boolean;
};
