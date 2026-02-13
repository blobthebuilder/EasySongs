interface BeanButtonProps {
  onClick: (e: any) => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  side?: "left" | "right" | "both";
  children: React.ReactNode;
  className?: string; // For things like fixed widths
  size?: "sm" | "md" | "lg";
}

export default function BeanButton({
  onClick,
  disabled,
  variant = "secondary",
  side = "both",
  children,
  className = "",
  size = "md",
}: BeanButtonProps) {
  // Define the size map
  const sizes = {
    sm: "h-7 px-3 text-[10px]", // Small (Toolbar style)
    md: "h-9 px-4 text-[11px]", // Medium (Default)
    lg: "h-11 px-8 text-[13px] gap-3", // Large (Header/Action style)
  };

  const padding = {
    both: size === "lg" ? "px-8" : size === "md" ? "px-4" : "px-3",
    left: size === "lg" ? "pl-8 pr-4" : "pl-4 pr-2", // Less padding on the right
    right: size === "lg" ? "pl-4 pr-6" : "pl-2 pr-3", // Less padding on the left
  };
  const rounding = {
    both: "rounded-full",
    left: "rounded-l-full rounded-r-none border-r-0",
    right: "rounded-r-full rounded-l-none border-l-[1px] border-l-white/10", // Subtle separator line
  };
  const baseStyles =
    "text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full transition-all whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center border border-transparent";

  const variants = {
    primary: "bg-[#1DB954] text-black hover:bg-[#1ed760] hover:scale-105",
    secondary: "bg-white/10 text-white hover:bg-white/20",
    danger:
      "bg-white/10 text-white enabled:hover:bg-red-500/20 enabled:hover:text-red-500 enabled:hover:border-red-500/30",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${padding[side]} ${rounding[side]} ${className}`}>
      {children}
    </button>
  );
}
