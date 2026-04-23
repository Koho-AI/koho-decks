import React from "react";
import OAuthClientsPage from "./OAuthClientsPage";

export const metadata = {
  title: "Authorized Clients | Koho Decks",
  description: "Review and revoke MCP clients authorized to access your account",
};

const page = () => {
  return <OAuthClientsPage />;
};

export default page;
