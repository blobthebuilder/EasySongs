import { TagsMap } from "./tags";

export type ApiArtist = {
  name: string;
};

export type ApiTrack = {
  id: string;
  name: string;
  artists: ApiArtist[];
  album: Album;
};

export type TrackDetails = {
  tracks: ApiTrack[];
  tags: TagsMap;
};

export type Album = {
  type: string;
  name: string;
};
