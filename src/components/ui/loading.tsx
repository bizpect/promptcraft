import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  size?: number;
  className?: string;
};

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent)]",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="loading"
    />
  );
}

type LoadingOverlayProps = {
  show: boolean;
};

export function LoadingOverlay({ show }: LoadingOverlayProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <LoadingSpinner size={48} />
    </div>
  );
}
