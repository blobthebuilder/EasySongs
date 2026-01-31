"use client";

export default function LoginPage() {
  const loginWithSpotify = () => {
    // Redirect browser to Go backend
    window.location.href = "http://127.0.0.1:8080/auth/login";
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 bg-green-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm text-center">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 bg-[#121212] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-4xl">💿</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-black tracking-tighter text-white mb-2">
          Welcome to EasySongs
        </h1>
        <p className="text-zinc-400 mb-10">
          Connect your account to start managing your library.
        </p>

        {/* Login Button */}
        <button
          onClick={loginWithSpotify}
          className="group relative w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-4 px-6 rounded-full transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_20px_rgba(29,185,84,0.2)]">
          {/* Subtle shine effect on hover */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-current"
            xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.491 17.293c-.213.341-.651.448-.992.235-2.731-1.674-6.173-2.053-10.224-1.127-.394.091-.795-.159-.885-.554-.09-.395.158-.796.554-.886 4.437-1.014 8.242-.58 11.313 1.302.341.213.447.651.234.99zm1.467-3.26c-.27.439-.844.58-1.282.311-3.123-1.92-7.882-2.479-11.573-1.357-.497.151-1.02-.128-1.171-.625-.151-.497.127-1.021.625-1.171 4.221-1.282 9.467-.648 13.09 1.579.438.27.579.843.311 1.282zm.126-3.411c-3.743-2.223-9.917-2.428-13.483-1.345-.574.174-1.179-.153-1.353-.727-.174-.574.152-1.179.726-1.353 4.108-1.248 10.922-1.012 15.234 1.549.516.306.685.975.379 1.491-.306.516-.976.686-1.492.385z" />
          </svg>
          Login with Spotify
        </button>

        {/* Footer info */}
        <p className="mt-8 text-xs text-zinc-500 uppercase tracking-widest font-medium">
          Secure OAuth2 Authentication
        </p>
      </div>
    </div>
  );
}
