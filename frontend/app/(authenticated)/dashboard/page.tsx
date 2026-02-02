import Link from "next/link";
import { fetchPlaylists } from "@/lib/api/playlists";
import AddPlaylistButton from "@/components/AddPlaylistToLikedButton";

export default async function DashboardPage() {
  const playlists = await fetchPlaylists();

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8 font-sans">
      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Good afternoon</h1>
          <p className="text-[#b3b3b3] text-sm font-medium">Your Playlists</p>
        </div>
        <Link href="/liked">
          <button className="bg-[#282828] hover:bg-[#3e3e3e] text-white px-5 py-2 rounded-full text-sm font-bold transition-colors">
            View Liked Songs
          </button>
        </Link>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {playlists.map((p) => (
          <div
            key={p.id}
            className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-lg transition-all duration-300 relative flex flex-col">
            <Link
              href={`/playlist/${p.id}`}
              className="flex-1">
              <div className="aspect-square w-full bg-[#333] rounded-md mb-4 shadow-2xl flex items-center justify-center text-4xl group-hover:shadow-none transition-shadow overflow-hidden relative">
                {p.images && p.images.length > 0 ? (
                  <img
                    src={p.images[0].url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    draggable="false"
                  />
                ) : (
                  <span>💿</span>
                )}
              </div>
              <h3 className="font-bold text-base truncate mb-1">{p.name}</h3>
            </Link>

            <div className="mt-auto">
              <AddPlaylistButton playlistId={p.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
