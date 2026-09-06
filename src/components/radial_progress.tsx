import React from "react";

/* =========================================================
   RADIAL PROGRESS
========================================================= */
type RadialSize = "sm" | "md" | "lg";

const RADIAL_SIZE_MAP: Record<RadialSize, string> = {
    sm: "3.5rem",
    md: "5rem",
    lg: "7rem",
};

const RADIAL_THICKNESS_MAP: Record<RadialSize, string> = {
    sm: "3px",
    md: "4px",
    lg: "5px",
};

interface RadialProgressProps {
    value: number; // 0-100
    size?: RadialSize;
    label?: string; // overrides the default "70%" text
    showValue?: boolean;
    tone?: "emerald" | "amber" | "red"; // matches your status colors
    className?: string;
}

const TONE_STYLES: Record<
    NonNullable<RadialProgressProps["tone"]>,
    { text: string; bg: string }
> = {
    emerald: { text: "text-emerald-700", bg: "bg-emerald-50" },
    amber: { text: "text-amber-600", bg: "bg-amber-50" },
    red: { text: "text-red-600", bg: "bg-red-50" },
};

export default function RadialProgress({
    value,
    size = "md",
    label,
    showValue = true,
    tone = "emerald",
    className = "",
}: RadialProgressProps) {
    const clamped = Math.min(100, Math.max(0, value));
    const toneStyle = TONE_STYLES[tone];

    return (
        <div
            className={`radial-progress ${toneStyle.text} ${toneStyle.bg} font-semibold ${className}`}
            style={
                {
                    "--value": clamped,
                    "--size": RADIAL_SIZE_MAP[size],
                    "--thickness": RADIAL_THICKNESS_MAP[size],
                } as React.CSSProperties
            }
            aria-valuenow={clamped}
            role="progressbar"
        >
            {label ?? `${clamped}%`}
            {showValue && !label && <span className="sr-only">{clamped} percent</span>}
        </div>
    );
}