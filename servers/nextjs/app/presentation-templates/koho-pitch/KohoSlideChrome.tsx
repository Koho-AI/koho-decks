import React from "react";
import { getTheme, type ThemeMode } from "./theme";

export interface KohoSlideChromeProps {
  /** Fallback slide number shown when dynamic index isn't available */
  slideNumber: string;
  totalSlides?: string;
  /** Dynamic slide index injected by Presenton at runtime (0-based) */
  dynamicIndex?: number;
  chapterLabel: string;
  metaRight?: string;
  sectionName: string;
  contourPosition?: "cover" | "thesis" | "mark" | "brief" | "default";
  /** Hide the blob mark in the header (use when the body already has a full logo) */
  hideHeaderMark?: boolean;
  /** Theme mode: 'dark' (default) or 'light' */
  theme?: ThemeMode;
  children: React.ReactNode;
}

// Each position maps to a specific contour form from the brand deck:
// cover → Form B Ridge, thesis → Form C Plateau, mark → Form A Hill,
// brief → Form A Hill, default → Form D Basin
const contourPositions: Record<
  NonNullable<KohoSlideChromeProps["contourPosition"]>,
  React.CSSProperties & { _formFile: string }
> = {
  cover: {
    _formFile: "form-b-ridge.svg",
    top: "-22%",
    right: "-28%",
    width: "88%",
    height: "135%",
    transform: "rotate(8deg)",
  } as any,
  thesis: {
    _formFile: "form-c-plateau.svg",
    top: "-15%",
    left: "-32%",
    width: "72%",
    height: "130%",
    transform: "rotate(-4deg)",
  } as any,
  mark: {
    _formFile: "form-a-hill.svg",
    top: "-5%",
    right: "-35%",
    width: "60%",
    height: "115%",
    transform: "rotate(5deg)",
  } as any,
  brief: {
    _formFile: "form-a-hill.svg",
    top: "-10%",
    right: "-30%",
    width: "70%",
    height: "120%",
    transform: "rotate(-6deg)",
  } as any,
  default: {
    _formFile: "form-d-basin.svg",
    top: "-22%",
    right: "-28%",
    width: "88%",
    height: "135%",
    transform: "rotate(8deg)",
  } as any,
};

const monoStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
};

function KohoSlideChrome({
  slideNumber,
  totalSlides,
  dynamicIndex,
  chapterLabel,
  metaRight,
  sectionName,
  contourPosition = "default",
  hideHeaderMark = false,
  theme,
  children,
}: KohoSlideChromeProps) {
  const t = getTheme(theme);
  const isLight = t.mode === "light";

  // Use dynamic index from Presenton runtime if available, otherwise fall back to hardcoded
  const displayNumber = dynamicIndex !== undefined
    ? String(dynamicIndex + 1).padStart(2, "0")
    : slideNumber;

  const { _formFile: contourFile, ...contourStyle } = contourPositions[contourPosition];
  const contourSrc = `${t.contourDir}/${contourFile}`;

  const dashedBorderStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(to right, ${t.rule} 0px, ${t.rule} 8px, transparent 8px, transparent 14px)`,
    backgroundRepeat: "repeat-x",
    backgroundSize: "14px 1px",
  };

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Slide Container — 1920×1080 (16:9 full HD) */}
      <div
        className="relative max-w-[1920px] max-h-[1080px] aspect-video overflow-hidden"
        style={{
          display: "grid",
          gridTemplateRows: "120px 1fr 84px",
          background: t.bg,
          border: `1px solid ${t.slideBorder}`,
          boxShadow: t.slideShadow,
          fontFamily: "'Manrope', sans-serif",
          width: "1920px",
          height: "1080px",
        }}
      >
        {/* Background Grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            opacity: 0.25,
            backgroundImage: [
              `linear-gradient(to right, ${t.grid} 1px, transparent 1px)`,
              `linear-gradient(to bottom, ${t.grid} 1px, transparent 1px)`,
            ].join(", "),
            backgroundSize: "108px 108px",
          }}
        />

        {/* Atmospheric Vignette — softer on light mode */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            background: isLight
              ? "radial-gradient(ellipse at center, transparent 60%, rgba(26,35,50,0.04) 100%)"
              : "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* Contour Wash — real organic terrain forms from the brand deck */}
        <div
          className="absolute pointer-events-none"
          style={{
            ...contourStyle,
            zIndex: 1,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={contourSrc}
            alt=""
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>

        {/* ─── Header ─── */}
        <header
          className="relative flex items-center justify-between"
          data-koho-chrome="true"
          style={{
            zIndex: 2,
            padding: "0 108px",
            ...dashedBorderStyle,
            backgroundPositionY: "bottom",
          }}
        >
          {/* LHS: blob mark + chapter label */}
          <div className="flex items-center gap-3">
            {/* Koho Blob Mark — 4-layer version, theme-aware fill */}
            {!hideHeaderMark && <svg
              width="77"
              height="72"
              viewBox="0 0 141 131"
              fill="none"
              className="flex-shrink-0"
            >
              <path opacity="0.28" d="M69.7283 0.351929C97.5808-2.89304 128.528 16.5768 137.812 47.404C147.096 78.2312 133.17 110.681 103.77 123.661C75.9177 136.641 38.7811 130.151 17.1181 109.058C-4.54491 87.9661-4.54491 50.6489 10.9287 26.3117C26.4023 1.97441 41.8758 3.5969 69.7283 0.351929Z" fill={t.signal}/>
              <path opacity="0.52" d="M79.0125 24.6892C99.1626 21.3433 119.244 34.4241 122.339 57.1389C125.433 79.8537 113.054 100.946 92.9387 107.436C72.8231 113.926 51.16 104.191 41.8759 86.3436C32.5917 68.4963 37.2338 45.7815 52.7074 34.4241C63.5389 26.3117 69.6626 25.8433 79.0125 24.6892Z" fill={t.signal}/>
              <path opacity="0.7" d="M83.6546 50.6489C96.6626 47.8432 108.412 53.8939 109.96 70.1187C111.507 86.3435 100.676 97.7009 86.7494 99.3234C72.8231 100.946 60.4443 91.211 58.8969 76.6086C57.3495 62.0063 65.9169 54.4747 83.6546 50.6489Z" fill={t.signal}/>
              <path d="M86.7821 56.0098C94.6626 54.8433 100.825 58.1919 101.699 67.5548C102.572 76.9177 99.1428 82.0735 91.2821 83.0098C83.4214 83.9461 74.6555 78.4364 73.7821 70.0098C72.9087 61.5831 76.7821 57.0098 86.7821 56.0098Z" fill={t.signal}/>
            </svg>}

            <span
              style={{
                ...monoStyle,
                fontSize: "16px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: t.inkDim,
              }}
            >
              <span style={{ color: t.signal, fontWeight: 700 }}>
                {displayNumber}
              </span>
              {" · "}
              {chapterLabel}
            </span>
          </div>

          {/* RHS: meta text */}
          {metaRight && (
            <span
              style={{
                ...monoStyle,
                fontSize: "14px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: t.inkFaint,
              }}
            >
              {metaRight}
            </span>
          )}
        </header>

        {/* ─── Body ─── */}
        <main
          className="relative flex flex-col overflow-hidden"
          style={{
            zIndex: 2,
            padding: "72px 108px 48px",
          }}
        >
          {children}
        </main>

        {/* ─── Footer ─── */}
        <footer
          className="relative flex items-center justify-between"
          data-koho-chrome="true"
          style={{
            zIndex: 2,
            padding: "0 108px",
            ...dashedBorderStyle,
            backgroundPositionY: "top",
          }}
        >
          {/* Left: section name */}
          <span
            style={{
              ...monoStyle,
              fontSize: "14px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: t.inkFaint,
            }}
          >
            &sect; {sectionName}
          </span>

          {/* Right: page number */}
          <span
            style={{
              ...monoStyle,
              fontSize: "14px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: t.inkFaint,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {displayNumber}
            {totalSlides ? ` / ${totalSlides}` : ""}
          </span>
        </footer>
      </div>
    </>
  );
}

export default KohoSlideChrome;
