"use client";

import React from "react";
import { getLayoutByLayoutId } from "@/app/presentation-templates";

/**
 * Minimal slide renderer for the public viewer (Phase 5).
 *
 * Doesn't pull in V1ContentRender — V1ContentRender relies on Redux
 * (useDispatch) which isn't mounted in the public route. The public
 * viewer just looks up the registered layout component and renders it
 * with the same data shape the editor uses.
 */
export default function PublicSlideRenderer({
  slide,
  theme,
}: {
  slide: {
    index: number;
    layout: string;
    layout_group?: string | null;
    content?: Record<string, unknown> | null;
  };
  theme?: { logo_url?: string | null; company_name?: string | null } | null;
}) {
  const template = getLayoutByLayoutId(slide.layout);
  const Layout = template?.component as
    | React.ComponentType<{ data: Record<string, unknown> }>
    | undefined;

  if (!Layout) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#5B6A7E",
          fontFamily: "var(--font-manrope), Manrope, sans-serif",
        }}
      >
        Layout &quot;{slide.layout}&quot; is not registered.
      </div>
    );
  }

  return (
    <Layout
      data={{
        ...(slide.content ?? {}),
        _logo_url__: theme?.logo_url ?? null,
        __companyName__: theme?.company_name ?? null,
        __slideIndex__: slide.index,
      }}
    />
  );
}
