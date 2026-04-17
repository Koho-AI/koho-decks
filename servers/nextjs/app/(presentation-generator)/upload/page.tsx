import React from "react";

import UploadPage from "./components/UploadPage";
import Header from "@/app/(presentation-generator)/(dashboard)/dashboard/components/Header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a deck | Koho Decks",
  description: "Koho Decks — pitch deck generator for the Koho team.",
  alternates: {
    canonical: "https://decks.koho.ai/create",
  },
  openGraph: {
    title: "Create a deck | Koho Decks",
    description: "Koho Decks — pitch deck generator for the Koho team.",
    type: "website",
    url: "https://decks.koho.ai/create",
    siteName: "Koho Decks",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create a deck | Koho Decks",
    description: "Koho Decks — pitch deck generator for the Koho team.",
  },
};

const page = () => {
  return (
    <div className="relative">
      <Header />
      <div className="flex flex-col items-center justify-center  mb-8">
        <h1 className="text-[64px] font-normal font-unbounded text-[#101323] ">
          New Koho Deck
        </h1>
        <p className="text-xl font-syne text-[#101323CC]">Pick a template, set preferences, and generate a brand-aligned deck.</p>
      </div>

      <UploadPage />
    </div>
  );
};

export default page;
