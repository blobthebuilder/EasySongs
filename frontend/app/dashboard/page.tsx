import Link from "next/link";
import { ApiPlaylist } from "@/types/api/playlists";
import { fetchPlaylists } from "@/lib/api/playlists";
import AddPlaylistButton from "@/components/AddPlaylistToLikedButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const playlists: ApiPlaylist[] = await fetchPlaylists();

  return (
    <div>
      <h1>Dashboard</h1>

      <Link href="/liked">
        <button>Go to Liked Songs</button>
      </Link>

      <h2>Playlists</h2>
      <ul>
        {playlists.map((p) => (
          <li key={p.id}>
            <Link href={`/playlist/${p.id}`}>
              <button>{p.name}</button>
            </Link>

            <AddPlaylistButton playlistId={p.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
