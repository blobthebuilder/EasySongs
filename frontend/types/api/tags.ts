export interface Tag {
  id: number;
  name: string;
  color: string;
}

export type TagsMap = {
  [trackId: string]: Tag[];
};
