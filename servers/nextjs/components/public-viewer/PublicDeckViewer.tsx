"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PublicSlideRenderer from "./PublicSlideRenderer";

type Slide = {
  id: string;
  index: number;
  layout: string;
  layout_group?: string | null;
  content?: Record<string, unknown> | null;
};

type DeckPayload = {
  presentation_id: string;
  title: string | null;
  layout: Record<string, unknown> | null;
  structure: Record<string, unknown> | null;
  theme: Record<string, unknown> | null;
  slides: Slide[];
};

const BASE_W = 1920;
const BASE_H = 1080;

export default function PublicDeckViewer({ deck }: { deck: DeckPayload }) {
  const [current, setCurrent] = useState(0);
  const [scale, setScale] = useState(1);

  const total = deck.slides.length;
  const goPrev = useCallback(
    () => setCurrent((i) => Math.max(0, i - 1)),
    []
  );
  const goNext = useCallback(
    () => setCurrent((i) => Math.min(total - 1, i + 1)),
    [total]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Responsive scaling: fit a 1920×1080 slide into the available viewport.
  useEffect(() => {
    const measure = () => {
      const padX = 48;
      const padY = 96; // chrome (header + nav controls)
      const w = window.innerWidth - padX;
      const h = window.innerHeight - padY;
      setScale(Math.min(w / BASE_W, h / BASE_H, 1));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (total === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#5B6A7E",
          fontFamily: "var(--font-manrope), Manrope, sans-serif",
        }}
      >
        This deck has no slides yet.
      </div>
    );
  }

  const slide = deck.slides[current];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0E14",
        color: "#E6EDF3",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-manrope), Manrope, sans-serif",
      }}
    >
      {/* Top chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 22px",
          fontSize: 13,
          color: "rgba(230,237,243,0.7)",
        }}
      >
        <span style={{ fontWeight: 500, color: "#E6EDF3" }}>
          {deck.title ?? "Untitled deck"}
        </span>
        <span
          style={{
            fontFamily:
              "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
            letterSpacing: "0.06em",
          }}
        >
          {current + 1} / {total}
        </span>
      </div>

      {/* Slide canvas */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: BASE_W,
            height: BASE_H,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            background: "#FFFFFF",
            color: "#1A2332",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <PublicSlideRenderer
            slide={slide}
            theme={
              deck.theme as
                | { logo_url?: string | null; company_name?: string | null }
                | null
            }
          />
        </div>
      </div>

      {/* Footer nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: "12px 22px 18px",
        }}
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={current === 0}
          aria-label="Previous slide"
          style={navButtonStyle(current === 0)}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={current === total - 1}
          aria-label="Next slide"
          style={navButtonStyle(current === total - 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function navButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 38,
    height: 38,
    borderRadius: 999,
    border: "1px solid rgba(230,237,243,0.18)",
    background: "rgba(230,237,243,0.04)",
    color: disabled ? "rgba(230,237,243,0.3)" : "#E6EDF3",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}
