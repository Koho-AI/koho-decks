import React from "react";

/**
 * Koho Decks wordmark — inline composition of the Koho mark + "Decks"
 * rendered in real Manrope (loaded via next/font in app/layout.tsx).
 *
 * Use this everywhere the Koho Decks logo appears in the editor UI;
 * keeps the SVG file (`/koho/logos/koho-decks-{dark,light}.svg`) for
 * OG images and external embeds where inline JSX isn't available.
 */

type Mode = "dark" | "light";
type Size = "sm" | "md" | "lg";

interface KohoDecksWordmarkProps {
  mode?: Mode;
  size?: Size;
  className?: string;
}

const SIZE_PX: Record<Size, { mark: number; label: number }> = {
  sm: { mark: 24, label: 18 },
  md: { mark: 32, label: 24 },
  lg: { mark: 48, label: 36 },
};

export const KohoDecksWordmark: React.FC<KohoDecksWordmarkProps> = ({
  mode = "dark",
  size = "md",
  className,
}) => {
  const { mark, label } = SIZE_PX[size];
  const markFill = mode === "dark" ? "#00E58A" : "#00C278";
  const labelColor = mode === "dark" ? "#FFFFFF" : "#1A2332";
  const dividerColor =
    mode === "dark" ? "rgba(255,255,255,0.35)" : "rgba(26,35,50,0.35)";

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(label * 0.5),
        lineHeight: 1,
      }}
    >
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 146 146"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          opacity="0.28"
          d="M69.7283 2.00867C97.5808 -1.2363 128.528 18.2335 137.812 49.0607C147.096 79.8879 133.17 112.338 103.77 125.317C75.9177 138.297 38.7811 131.807 17.1181 110.715C-4.54491 89.6228 -4.54491 52.3057 10.9287 27.9684C26.4023 3.63115 41.8758 5.25364 69.7283 2.00867Z"
          fill={markFill}
        />
        <path
          opacity="0.52"
          d="M79.0125 26.3459C99.1626 23 119.244 36.0809 122.339 58.7956C125.433 81.5104 113.054 102.603 92.9387 109.093C72.8231 115.583 51.16 105.848 41.8759 88.0003C32.5917 70.153 37.2338 47.4382 52.7074 36.0809C63.5389 27.9684 69.6626 27.5 79.0125 26.3459Z"
          fill={markFill}
        />
        <path
          opacity="0.7"
          d="M83.6546 52.3056C96.6626 49.5 108.412 55.5506 109.96 71.7754C111.507 88.0003 100.676 99.3577 86.7494 100.98C72.8231 102.603 60.4443 92.8677 58.8969 78.2654C57.3495 63.663 65.9169 56.1315 83.6546 52.3056Z"
          fill={markFill}
        />
        <path
          d="M86.7821 57.6665C94.6626 56.5 100.825 59.8486 101.699 69.2115C102.572 78.5745 99.1428 83.7302 91.2821 84.6665C83.4214 85.6028 74.6555 80.0931 73.7821 71.6665C72.9087 63.2399 76.7821 58.6665 86.7821 57.6665Z"
          fill={markFill}
        />
      </svg>
      <span
        style={{
          fontFamily: "var(--font-manrope), 'Manrope', sans-serif",
          fontWeight: 500,
          fontSize: `${label}px`,
          color: labelColor,
          letterSpacing: "-0.01em",
          display: "inline-flex",
          alignItems: "center",
          gap: Math.round(label * 0.45),
        }}
      >
        <span style={{ fontWeight: 700 }}>Koho</span>
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 1,
            height: Math.round(label * 0.85),
            background: dividerColor,
          }}
        />
        <span style={{ fontWeight: 300 }}>Decks</span>
      </span>
    </span>
  );
};

export default KohoDecksWordmark;
