import { getHeader } from "@/app/(presentation-generator)/services/api/header";
import { ApiResponseHandler } from "@/app/(presentation-generator)/services/api/api-error-handler";


export interface OAuthClientListItem {
  id: string;
  client_id: string;
  client_name: string;
  created_at: string;
  last_used_at: string | null;
}


export interface ConsentSubmitPayload {
  client_id: string;
  redirect_uri: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: string;
  state?: string | null;
}


export interface ConsentSubmitResponse {
  redirect_url: string;
}


export class OAuthClientsApi {
  static async list(): Promise<OAuthClientListItem[]> {
    const response = await fetch(`/oauth/my-clients`, { method: "GET" });
    return await ApiResponseHandler.handleResponse(
      response,
      "Failed to load authorized clients"
    );
  }

  static async revoke(clientPk: string): Promise<boolean> {
    const response = await fetch(`/oauth/my-clients/${clientPk}`, {
      method: "DELETE",
      headers: getHeader(),
    });
    return await ApiResponseHandler.handleResponse(
      response,
      "Failed to revoke client"
    );
  }

  static async submitConsent(
    payload: ConsentSubmitPayload
  ): Promise<ConsentSubmitResponse> {
    const response = await fetch(`/oauth/consent`, {
      method: "POST",
      headers: getHeader(),
      body: JSON.stringify(payload),
    });
    return await ApiResponseHandler.handleResponse(
      response,
      "Could not complete authorization"
    );
  }
}
