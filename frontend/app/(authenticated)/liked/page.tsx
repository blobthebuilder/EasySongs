import { fetchLikedSongsDetails } from "@/lib/api/fetchLiked";
import PlaylistHeader from "@/components/PlaylistHeader";
import BackButton from "@/components/BackButton";
import TrackTable from "@/components/TrackTable";
import { fetchPlaylists } from "@/lib/api/playlists";
import { TrackDetails } from "@/types/api/tracks";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Liked Songs | EasySongs",
  };
}

export default async function LikedPage() {
  const likedSongsDetails: TrackDetails = await fetchLikedSongsDetails();
  const likedSongs = likedSongsDetails.tracks;
  const userPlaylists = await fetchPlaylists().catch(() => []);

  return (
    <div className="min-h-screen bg-[#121212]">
      <PlaylistHeader
        title="Liked Songs"
        itemCount={likedSongs.length}
        imageEmoji="♥"
        gradientFrom="from-[#20154d]"
        gradientTo="to-[#8d8ad3]">
        <BackButton />
      </PlaylistHeader>

      <div className="px-8 pb-10">
        <TrackTable
          tracks={likedSongs}
          userPlaylists={userPlaylists}
          playlistId={"liked-songs"}
          tags={likedSongsDetails.tags}
        />
      </div>
    </div>
  );
}
