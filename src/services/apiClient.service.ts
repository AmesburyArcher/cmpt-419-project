import { API_CONFIG } from "@/config/api.config.ts";

export class ApiClient {
  private readonly baseURL: string;
  private readonly apiKey: string;

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private buildURL(endpoint: string, params: Record<string, any> = {}): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    url.searchParams.append("apiKey", this.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  async get<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = this.buildURL(endpoint, params);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const remainingRequests = response.headers.get("x-requests-remaining");
      // const usedRequests = response.headers.get('x-requests-used');

      if (remainingRequests) {
        console.log(`Remaining API requests: ${remainingRequests}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }
}

export const oddsApiClient = new ApiClient(
  API_CONFIG.ODDS_API.BASE_URL,
  API_CONFIG.ODDS_API.API_KEY,
);
