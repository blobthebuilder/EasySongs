import Link from "next/link";

export default function LeftSection() {
  return (
    <div className="flex flex-col justify-center px-8 md:px-20 lg:px-32 bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] from-green-900/10 via-transparent to-transparent">
      <div className="inline-flex items-center gap-2 mb-6">
        <span className="font-bold tracking-tight text-xl">EasySongs</span>
      </div>

      <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
        Clean your <br />
        <span className="text-green-500">Playlists.</span>
      </h1>

      <p className="text-lg md:text-xl text-zinc-400 max-w-md mb-10 leading-relaxed">
        The ultimate toolkit for Spotify. Remove duplicates, mass-select tracks,
        and organize your library with a single click.
      </p>

      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <button className="bg-green-500 hover:bg-green-400 text-black px-8 py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            Connect Spotify
          </button>
        </Link>
      </div>
    </div>
  );
}
