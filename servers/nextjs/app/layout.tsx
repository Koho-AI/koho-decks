import type { Metadata } from "next";
import localFont from "next/font/local";
import { Syne, Unbounded, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import MixpanelInitializer from "./MixpanelInitializer";
import { Toaster } from "@/components/ui/sonner";
const inter = localFont({
  src: [
    {
      path: "./fonts/Inter.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-unbounded",
});

// Koho V3 brand fonts
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-manrope",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jetbrains-mono",
});


export const metadata: Metadata = {
  metadataBase: new URL("https://decks.koho.ai"),
  title: "Koho Decks — Pitch deck generator for flex workspace operations",
  description:
    "Koho Decks: the internal pitch deck generator for the Koho team. Signal-green brand templates, ToV baked in, pitch to clients in minutes.",
  keywords: [
    "Koho",
    "Koho Decks",
    "pitch deck",
    "flex workspace operations",
    "context platform",
    "presentation generator",
  ],
  openGraph: {
    title: "Koho Decks",
    description:
      "Internal pitch deck generator for the Koho team. Brand-aligned slides, ToV baked in.",
    url: "https://decks.koho.ai",
    siteName: "Koho Decks",
    images: [
      {
        url: "/koho/logos/koho-dark.svg",
        width: 1200,
        height: 630,
        alt: "Koho Decks",
      },
    ],
    type: "website",
    locale: "en_GB",
  },
  alternates: {
    canonical: "https://decks.koho.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Koho Decks",
    description:
      "Internal pitch deck generator for the Koho team.",
    images: ["/koho/logos/koho-dark.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${unbounded.variable} ${syne.variable} ${manrope.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>
          <MixpanelInitializer>

            {children}

          </MixpanelInitializer>
        </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
