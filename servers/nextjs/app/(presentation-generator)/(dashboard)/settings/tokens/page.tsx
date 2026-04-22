import React from "react";
import TokensPage from "./TokensPage";

export const metadata = {
  title: "Personal Access Tokens | Koho Decks",
  description: "Create and revoke personal access tokens for MCP clients",
};

const page = () => {
  return <TokensPage />;
};

export default page;
