import { ApiTrack } from "@/types/api/tracks";
import { fetchLikedSongs } from "@/lib/api/fetchLiked";
import PlaylistHeader from "@/components/PlaylistHeader";
import BackButton from "@/components/BackButton";
import TrackTable from "@/components/TrackTable";
import { fetchPlaylists } from "@/lib/api/playlists";

export const dynamic = "force-dynamic";

export default async function LikedPage() {
  const likedSongs: ApiTrack[] = await fetchLikedSongs();
  const userPlaylists = await fetchPlaylists().catch(() => []);

  return (
    <div className="min-h-screen bg-[#121212]">
      <PlaylistHeader
        title="Liked Songs"
        itemCount={likedSongs.length}
        imageEmoji="🤍"
        gradientFrom="from-[#5038a0]">
        <BackButton />
      </PlaylistHeader>

      <div className="px-8 pb-10">
        <TrackTable
          tracks={likedSongs}
          userPlaylists={userPlaylists}
        />
      </div>
    </div>
  );
}
