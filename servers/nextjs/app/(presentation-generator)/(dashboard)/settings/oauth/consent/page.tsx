import React from "react";
import ConsentPage from "./ConsentPage";

export const metadata = {
  title: "Authorize | Koho Decks",
  description: "Approve an MCP client to access Koho Decks as you",
};

const page = () => {
  return <ConsentPage />;
};

export default page;
