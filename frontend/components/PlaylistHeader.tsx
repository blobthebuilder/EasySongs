interface PlaylistHeaderProps {
  title: string;
  type?: string;
  itemCount: number;
  images?: { url: string }[];
  imageEmoji?: string;
  gradientFrom?: string;
  gradientTo?: string; // Added for the icon gradient
  children?: React.ReactNode;
}

export default function PlaylistHeader({
  title,
  type = "Playlist",
  itemCount,
  images,
  imageEmoji = "💿",
  gradientFrom = "from-[#404040]",
  gradientTo, // e.g., "to-[#c4efd9]"
  children,
}: PlaylistHeaderProps) {
  const imageUrl = images && images.length > 0 ? images[0].url : null;

  // Logic to determine if we should show the "Heart" gradient box
  const isHeartIcon = imageEmoji === "🤍" || imageEmoji === "♥";

  return (
    <div className={`bg-linear-to-b ${gradientFrom} to-[#121212] p-8 pt-6`}>
      <nav className="mb-6">{children}</nav>
      <div className="flex items-end gap-6">
        {/* Cover Art Container */}
        <div
          className={`w-52 h-52 shadow-2xl flex items-center justify-center rounded-md shrink-0 overflow-hidden
          ${
            !imageUrl && isHeartIcon
              ? `bg-linear-to-br from-[#450af5] ${gradientTo || "to-[#c4efd9]"}`
              : "bg-[#282828]"
          }`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              draggable="false"
            />
          ) : (
            <span className={`text-6xl ${isHeartIcon ? "text-white" : ""}`}>
              {imageEmoji}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {type}
          </span>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-4 text-white">
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
