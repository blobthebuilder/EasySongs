import { fetchPlaylistDetails } from "@/lib/api/playlists";
import PlaylistHeader from "@/components/PlaylistHeader";
import TrackTable from "@/components/TrackTable";
import BackButton from "@/components/BackButton";
import AddToLikedButton from "@/components/AddPlaylistToLikedButton";
import RemoveDuplicatesButton from "@/components/RemoveDuplicatesButton";
import { fetchPlaylists } from "@/lib/api/playlists";
import { Metadata } from "next";
import SaveVersionButton from "@/components/SaveVersionButton";

// disable caching, forcing refetch every load
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ playlistId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { playlistId } = await params;

  const data = await fetchPlaylistDetails(playlistId).catch(() => null);

  return {
    title: data ? `${data.name} | EasySongs` : "Playlist | EasySongs",
  };
}

export default async function PlaylistPage({ params }: PageProps) {
  const { playlistId } = await params;

  const data = await fetchPlaylistDetails(playlistId).catch(() => null);

  if (!data) {
    return <div className="p-8 text-white">Playlist not found.</div>;
  }

  const userPlaylists = await fetchPlaylists().catch(() => []);

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <PlaylistHeader
        title={data.name}
        images={data.images}
        itemCount={data.tracks.length}
        gradientFrom="from-[#404040]">
        <BackButton />
      </PlaylistHeader>

      {/* Second header */}
      <div className="px-8 py-6 flex items-center gap-6">
        <AddToLikedButton playlistId={playlistId} />
        <RemoveDuplicatesButton playlistId={playlistId} />
        <SaveVersionButton playlistId={playlistId} />
      </div>

      {/* Reusable Track List with Selection Logic */}
      <div className="px-8 pb-10">
        {data.tracks.length === 0 ? (
          <p className="text-[#b3b3b3] p-4">This playlist is empty.</p>
        ) : (
          <TrackTable
            tracks={data.tracks}
            tags={data.tags}
            userPlaylists={userPlaylists}
            playlistId={playlistId}
          />
        )}
      </div>
    </div>
  );
}
