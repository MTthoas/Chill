import {
  SportRadarCompetitor,
  SportRadarPlayer,
  SportRadarSeasonInfo,
  SportRadarStatistics,
} from "../types/api.types";
import {
  isValidCompetitorId,
  isValidSeasonId,
  validateCompetitors,
  validatePlayers,
  validateSeasonInfo,
  validateStatistics,
} from "../utils/validation";

export class SportRadarService {
  private readonly apiKey: string;
  private readonly baseUrl: string =
    "https://api.sportradar.com/soccer/trial/v4/en";
  private readonly rateLimitDelay: number = 1200; // 1.2 seconds to respect rate limits

  constructor() {
    this.apiKey = process.env.SPORTRADAR_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("SPORTRADAR_API_KEY environment variable is required");
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}?api_key=${this.apiKey}`;

    try {
      console.log(`Making SportRadar API request: ${endpoint}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as T;

      // Add delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));

      return data;
    } catch (error) {
      console.error(`SportRadar API error for ${endpoint}:`, error);
      throw error;
    }
  }

  async fetchSeasonInfo(seasonId: string): Promise<SportRadarSeasonInfo> {
    if (!isValidSeasonId(seasonId)) {
      throw new Error(`Invalid season ID format: ${seasonId}`);
    }

    const data = await this.makeRequest<unknown>(`/seasons/${seasonId}/info`);

    if (!validateSeasonInfo(data)) {
      throw new Error("Invalid season info response from SportRadar API");
    }

    return data;
  }

  async fetchCompetitors(seasonId: string): Promise<SportRadarCompetitor[]> {
    if (!isValidSeasonId(seasonId)) {
      throw new Error(`Invalid season ID format: ${seasonId}`);
    }

    const response = await this.makeRequest<{ competitors: unknown }>(
      `/seasons/${seasonId}/competitors`
    );

    if (!response.competitors || !validateCompetitors(response.competitors)) {
      throw new Error("Invalid competitors response from SportRadar API");
    }

    return response.competitors as SportRadarCompetitor[];
  }

  async fetchPlayers(competitorId: string): Promise<SportRadarPlayer[]> {
    if (!isValidCompetitorId(competitorId)) {
      throw new Error(`Invalid competitor ID format: ${competitorId}`);
    }

    const response = await this.makeRequest<{ players: unknown }>(
      `/competitors/${competitorId}/profile`
    );

    if (!response.players || !validatePlayers(response.players)) {
      throw new Error("Invalid players response from SportRadar API");
    }

    return response.players as SportRadarPlayer[];
  }

  async fetchStatistics(seasonId: string): Promise<SportRadarStatistics> {
    if (!isValidSeasonId(seasonId)) {
      throw new Error(`Invalid season ID format: ${seasonId}`);
    }

    const data = await this.makeRequest<unknown>(
      `/seasons/${seasonId}/statistics`
    );

    if (!validateStatistics(data)) {
      throw new Error("Invalid statistics response from SportRadar API");
    }

    return data as SportRadarStatistics;
  }

  // Utility method to check if SportRadar API is accessible
  async healthCheck(): Promise<boolean> {
    try {
      // Make a simple request to test API accessibility
      const testSeasonId = "sr:season:118689"; // A known test season ID
      await this.makeRequest<unknown>(`/seasons/${testSeasonId}/info`);
      return true;
    } catch (error) {
      console.error("SportRadar API health check failed:", error);
      return false;
    }
  }

  // Get rate limit delay for external use
  getRateLimitDelay(): number {
    return this.rateLimitDelay;
  }
}
