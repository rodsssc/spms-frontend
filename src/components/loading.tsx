/* =========================================================
   LOADING SPINNER
========================================================= */
type LoadingSize = "xs" | "sm" | "md" | "lg";
type LoadingVariant = "spinner" | "dots" | "ring" | "ball" | "bars";

interface LoadingProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  label?: string;
  className?: string;
}

export default function Loading({
  size = "sm",
  variant = "spinner",
  label,
  className = "",
}: LoadingProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`loading loading-${variant} loading-${size} text-emerald-700 ${className}`}
        role="status"
        aria-label={label ?? "Loading"}
      />
      {label && <span className="text-xs text-slate-500">{label}</span>}
    </div>
  );
}

/* Full-card / full-page overlay variant, for loading states inside a Card */
export function LoadingOverlay({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[160px] w-full flex-col items-center justify-center gap-2 py-10">
      <span className="loading loading-spinner loading-md text-emerald-700" />
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
