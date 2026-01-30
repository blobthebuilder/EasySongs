interface PlaylistHeaderProps {
  title: string;
  type?: string;
  itemCount: number;
  imageEmoji?: string;
  gradientFrom?: string;
  children?: React.ReactNode; // For the BackButton or other nav
}

export default function PlaylistHeader({
  title,
  type = "Playlist",
  itemCount,
  imageEmoji = "💿",
  gradientFrom = "from-[#404040]",
  children,
}: PlaylistHeaderProps) {
  return (
    <div className={`bg-linear-to-b ${gradientFrom} to-[#121212] p-8 pt-6`}>
      <nav className="mb-6">{children}</nav>
      <div className="flex items-end gap-6">
        <div className="w-52 h-52 bg-[#282828] shadow-2xl flex items-center justify-center text-6xl rounded-md shrink-0">
          {imageEmoji}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {type}
          </span>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-4">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-sm font-medium text-[#b3b3b3]">
            <span className="text-white">User</span>
            <span>•</span>
            <span>{itemCount} songs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
