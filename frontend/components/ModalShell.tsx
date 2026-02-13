interface ModalShellProps {
  onClose: () => void;
  children: React.ReactNode;
}

export default function ModalShell({ onClose, children }: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose} // Close when clicking the backdrop
    >
      <div
        onClick={(e) => e.stopPropagation()} // Don't close when clicking the modal itself
        className="relative shadow-2xl">
        {children}
      </div>
    </div>
  );
}
