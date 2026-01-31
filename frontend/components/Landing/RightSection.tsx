export default function RightSection() {
  return (
    <div className="relative flex items-center justify-center bg-[#0c0c0e] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-125 h-125 bg-green-500/10 rounded-full blur-[120px]" />

      <div className="relative group p-4">
        {/* Decorative Frame */}
        <div className="absolute -inset-1 bg-linear-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>

        <div className="relative bg-[#18181b] rounded-xl border border-white/10 shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
          <img
            src="/spotify-preview.png"
            alt="Spotify preview"
            className="max-w-md rounded-lg shadow-2xl"
          />
        </div>

        {/* Floating UI Elements (Optional Badges) */}
        <div className="absolute -bottom-4 -left-4 bg-zinc-900/80 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-2xl animate-float">
          <p className="text-[10px] text-green-500 uppercase font-bold tracking-[0.2em] mb-1">
            Efficiency
          </p>
          <p className="text-sm font-bold text-white">+40% Faster</p>
        </div>
      </div>
    </div>
  );
}
