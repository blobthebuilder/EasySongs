import { ApiTrack } from "@/types/api/tracks";
import { fetchPlaylistTracks } from "@/lib/api/tracks";
import AddToLikedButton from "@/components/AddPlaylistToLikedButton";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ playlistId: string }>;
  searchParams: Promise<{ snapshotId?: string }>;
};

export default async function PlaylistPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const playlistId = resolvedParams.playlistId;
  const snapshotId = resolvedSearchParams.snapshotId;

  if (!playlistId) {
    return <div>Missing playlist ID</div>;
  }

  if (!snapshotId) {
    return <div>Missing snapshotId</div>;
  }

  let tracks: ApiTrack[] = [];

  try {
    tracks = await fetchPlaylistTracks(playlistId);
  } catch (err) {
    return <div>Failed to load playlist</div>;
  }

  return (
    <div>
      <h1>Playlist</h1>

      <BackButton />
      <AddToLikedButton playlistId={playlistId} />

      {tracks.length === 0 ? (
        <p>This playlist is empty.</p>
      ) : (
        <ul>
          {tracks.map((t, i) => (
            <li key={`${t.id}-${i}`}>
              {t.name} — {t.artists.map((a) => a.name).join(", ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
