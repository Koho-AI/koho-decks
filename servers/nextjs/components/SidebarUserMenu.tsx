"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";

type Me = {
  name: string | null;
  email: string | null;
  image: string | null;
};

/**
 * Narrow-sidebar variant of the user menu. Avatar stacks vertically
 * to fit the 115px DashboardSidebar; dropdown opens to the right.
 */
export default function SidebarUserMenu() {
  const [me, setMe] = useState<Me | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (s?.user) {
          setMe({
            name: s.user.name ?? null,
            email: s.user.email ?? null,
            image: s.user.image ?? null,
          });
        }
      })
      .catch(() => {});
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken ?? ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!me) return null;

  const initials = (me.name || me.email || "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const firstName =
    me.name?.split(" ")[0] ?? me.email?.split("@")[0] ?? "Me";

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          padding: "8px 0",
          width: "100%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-manrope), Manrope, sans-serif",
        }}
      >
        {me.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={me.image}
            alt={me.name ?? me.email ?? ""}
            width={28}
            height={28}
            style={{ borderRadius: "50%" }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#00C278",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {initials}
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            color: "#1A2332",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {firstName}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            left: "calc(100% + 8px)",
            bottom: 0,
            minWidth: 240,
            background: "#FFFFFF",
            border: "1px solid rgba(26,35,50,0.10)",
            borderRadius: 12,
            boxShadow: "0 10px 30px -10px rgba(26,35,50,0.18)",
            padding: 8,
            fontFamily: "var(--font-manrope), Manrope, sans-serif",
            zIndex: 60,
          }}
        >
          <div style={{ padding: "10px 12px 12px" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#1A2332" }}>
              {me.name ?? ""}
            </div>
            <div style={{ fontSize: 12, color: "#5B6A7E" }}>{me.email}</div>
          </div>
          <div style={{ height: 1, background: "rgba(26,35,50,0.08)" }} />
          <form method="POST" action="/api/auth/signout" style={{ margin: 0 }}>
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="callbackUrl" value="/signin" />
            <button
              type="submit"
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                background: "transparent",
                border: "none",
                borderRadius: 8,
                color: "#1A2332",
                fontSize: 14,
                fontFamily: "var(--font-manrope), Manrope, sans-serif",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
