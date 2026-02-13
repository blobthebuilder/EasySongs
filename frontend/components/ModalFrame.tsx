interface ModalFrameProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function ModalFrame({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: ModalFrameProps) {
  return (
    <div className="w-80 bg-[#282828] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
      {/* HEADER */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-zinc-500 uppercase font-bold mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-5">{children}</div>

      {/* OPTIONAL FOOTER */}
      {footer && (
        <div className="px-5 py-3 bg-white/5 border-t border-white/5 flex justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}
