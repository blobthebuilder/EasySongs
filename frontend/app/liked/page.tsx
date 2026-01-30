import { ApiTrack } from "@/types/api/tracks";
import { fetchLikedSongs } from "@/lib/api/fetchLiked";

export const dynamic = "force-dynamic";

export default async function LikedPage() {
  const likedSongs: ApiTrack[] = await fetchLikedSongs();

  return (
    <div>
      <h1>Liked Songs</h1>
      <ul>
        {likedSongs.map((t) => (
          <li key={t.id}>
            {t.name} — {t.artists.map((a) => a.name).join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
