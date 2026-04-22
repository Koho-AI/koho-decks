import { getHeader } from "@/app/(presentation-generator)/services/api/header";
import { ApiResponseHandler } from "@/app/(presentation-generator)/services/api/api-error-handler";


export interface TokenListItem {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export interface CreatedTokenResponse {
  id: string;
  name: string;
  /** Raw PAT — shown once at creation, never returned again. */
  token: string;
  prefix: string;
  created_at: string;
}


export class TokensApi {
  static async list(): Promise<TokenListItem[]> {
    const response = await fetch(`/api/v1/ppt/tokens`, { method: "GET" });
    return await ApiResponseHandler.handleResponse(
      response,
      "Failed to load tokens"
    );
  }

  static async create(name: string): Promise<CreatedTokenResponse> {
    const response = await fetch(`/api/v1/ppt/tokens`, {
      method: "POST",
      headers: getHeader(),
      body: JSON.stringify({ name }),
    });
    return await ApiResponseHandler.handleResponse(
      response,
      "Failed to create token"
    );
  }

  static async revoke(id: string): Promise<boolean> {
    const response = await fetch(`/api/v1/ppt/tokens/${id}`, {
      method: "DELETE",
      headers: getHeader(),
    });
    return await ApiResponseHandler.handleResponse(
      response,
      "Failed to revoke token"
    );
  }
}
