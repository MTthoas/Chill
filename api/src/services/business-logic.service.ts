import {
  CompetitorFilters,
  CompetitorStatisticsFilters,
  CreateCompetitorRequest,
  CreateCompetitorStatisticsRequest,
  CreatePlayerRequest,
  CreatePlayerStatisticsRequest,
  CreateSeasonRequest,
  PlayerFilters,
  PlayerStatisticsFilters,
  SeasonFilters,
} from "../types/api.types";
import { extractCompetitorId } from "../utils/query-builders";
import { DatabaseService } from "./database.service";
import { SportRadarService } from "./sportradar.service";

export class BusinessLogicService {
  private sportRadarService: SportRadarService;
  private databaseService: DatabaseService;

  constructor() {
    this.sportRadarService = new SportRadarService();
    this.databaseService = new DatabaseService();
  }

  async cleanup(): Promise<void> {
    await this.databaseService.disconnect();
  }

  // Season operations
  async getSeasons(filters: SeasonFilters) {
    return this.databaseService.findSeasons(filters);
  }

  async getSeasonById(id: number, filters: SeasonFilters) {
    const include = this.databaseService.findSeasonById(id);
    return include;
  }

  async createSeasonFromSportRadar(seasonId: string): Promise<any> {
    // Fetch season info from SportRadar
    const seasonInfo = await this.sportRadarService.fetchSeasonInfo(seasonId);

    // Create season in database
    const season = await this.databaseService.createSeasonFromSportRadar(
      seasonInfo,
      seasonId
    );

    return season;
  }

  async createSeasonAndPopulateData(seasonId: string): Promise<any> {
    // Create the season first
    const season = await this.createSeasonFromSportRadar(seasonId);

    // Fetch and create competitors
    const competitors = await this.sportRadarService.fetchCompetitors(seasonId);
    const createdCompetitors = [];

    for (const competitor of competitors) {
      try {
        const createdCompetitor =
          await this.databaseService.createCompetitorFromSportRadar(
            competitor,
            season.id
          );
        createdCompetitors.push(createdCompetitor);

        // Add delay to respect rate limits
        await new Promise((resolve) =>
          setTimeout(resolve, this.sportRadarService.getRateLimitDelay())
        );
      } catch (error) {
        console.error(`Failed to create competitor ${competitor.name}:`, error);
      }
    }

    return {
      season,
      competitors: createdCompetitors,
    };
  }

  async createSeason(data: CreateSeasonRequest) {
    return this.databaseService.createSeason(data);
  }

  async updateSeason(id: number, data: any) {
    return this.databaseService.updateSeason(id, data);
  }

  async deleteSeason(id: number) {
    return this.databaseService.deleteSeason(id);
  }

  // Competitor operations
  async getCompetitors(filters: CompetitorFilters) {
    return this.databaseService.findCompetitors(filters);
  }

  async getCompetitorById(id: number, filters: CompetitorFilters) {
    const include = this.databaseService.findCompetitorById(id);
    return include;
  }

  async createCompetitorFromSportRadar(
    competitorId: string,
    seasonId: number
  ): Promise<any> {
    // For creating individual competitors, we need season context
    // This could be expanded to fetch competitor details from SportRadar
    throw new Error(
      "Individual competitor creation from SportRadar not implemented. Use createSeasonAndPopulateData instead."
    );
  }

  async createCompetitor(data: CreateCompetitorRequest) {
    return this.databaseService.createCompetitor(data);
  }

  async updateCompetitor(id: number, data: any) {
    return this.databaseService.updateCompetitor(id, data);
  }

  async deleteCompetitor(id: number) {
    return this.databaseService.deleteCompetitor(id);
  }

  // Player operations
  async getPlayers(filters: PlayerFilters) {
    return this.databaseService.findPlayers(filters);
  }

  async getPlayerById(id: number, filters: PlayerFilters) {
    const include = this.databaseService.findPlayerById(id);
    return include;
  }

  async createPlayersFromSportRadar(competitorId: string): Promise<any> {
    // Find the competitor in our database
    const competitor = await this.databaseService.findCompetitorBySpecialId(
      competitorId
    );
    if (!competitor) {
      throw new Error(`Competitor not found with special_id: ${competitorId}`);
    }

    // Fetch players from SportRadar
    const players = await this.sportRadarService.fetchPlayers(competitorId);
    const createdPlayers = [];

    for (const player of players) {
      try {
        const createdPlayer =
          await this.databaseService.createPlayerFromSportRadar(
            player,
            competitor.id
          );
        createdPlayers.push(createdPlayer);

        // Add delay to respect rate limits
        await new Promise((resolve) =>
          setTimeout(resolve, this.sportRadarService.getRateLimitDelay())
        );
      } catch (error) {
        console.error(`Failed to create player ${player.name}:`, error);
      }
    }

    return {
      competitor,
      players: createdPlayers,
    };
  }

  async createPlayer(data: CreatePlayerRequest) {
    return this.databaseService.createPlayer(data);
  }

  async updatePlayer(id: number, data: any) {
    return this.databaseService.updatePlayer(id, data);
  }

  async deletePlayer(id: number) {
    return this.databaseService.deletePlayer(id);
  }

  // Competitor Statistics operations
  async getCompetitorStatistics(filters: CompetitorStatisticsFilters) {
    return this.databaseService.findCompetitorStatistics(filters);
  }

  async getCompetitorStatisticsById(
    id: number,
    filters: CompetitorStatisticsFilters
  ) {
    const include = this.databaseService.findCompetitorStatisticsById(id);
    return include;
  }

  async createCompetitorStatisticsFromSportRadar(
    seasonId: string
  ): Promise<any> {
    // Fetch statistics from SportRadar
    const statistics = await this.sportRadarService.fetchStatistics(seasonId);

    // Find the season in our database
    const season = await this.databaseService.findSeasonBySpecialId(seasonId);
    if (!season) {
      throw new Error(`Season not found with special_id: ${seasonId}`);
    }

    const createdStatistics = [];

    // Process competitor statistics
    if (statistics.competitors && Array.isArray(statistics.competitors)) {
      for (const competitorStats of statistics.competitors) {
        try {
          // Find the competitor in our database
          const competitorId = extractCompetitorId(
            competitorStats.competitor.id
          );
          const competitor =
            await this.databaseService.findCompetitorBySpecialId(competitorId);

          if (competitor && competitorStats.statistics) {
            // Create statistics entries for this competitor
            for (const [statType, statValue] of Object.entries(
              competitorStats.statistics
            )) {
              if (statValue !== null && statValue !== undefined) {
                const statData: CreateCompetitorStatisticsRequest = {
                  type: statType,
                  value: Number(statValue),
                  competitorId: competitor.id,
                };

                const createdStat =
                  await this.databaseService.createCompetitorStatistics(
                    statData
                  );
                createdStatistics.push(createdStat);
              }
            }
          }
        } catch (error) {
          console.error("Failed to create competitor statistics:", error);
        }
      }
    }

    return {
      season,
      statistics: createdStatistics,
    };
  }

  async createCompetitorStatistics(data: CreateCompetitorStatisticsRequest) {
    return this.databaseService.createCompetitorStatistics(data);
  }

  async updateCompetitorStatistics(id: number, data: any) {
    return this.databaseService.updateCompetitorStatistics(id, data);
  }

  async deleteCompetitorStatistics(id: number) {
    return this.databaseService.deleteCompetitorStatistics(id);
  }

  // Player Statistics operations
  async getPlayerStatistics(filters: PlayerStatisticsFilters) {
    return this.databaseService.findPlayerStatistics(filters);
  }

  async getPlayerStatisticsById(id: number, filters: PlayerStatisticsFilters) {
    const include = this.databaseService.findPlayerStatisticsById(id);
    return include;
  }

  async createPlayerStatistics(data: CreatePlayerStatisticsRequest) {
    return this.databaseService.createPlayerStatistics(data);
  }

  async updatePlayerStatistics(id: number, data: any) {
    return this.databaseService.updatePlayerStatistics(id, data);
  }

  async deletePlayerStatistics(id: number) {
    return this.databaseService.deletePlayerStatistics(id);
  }

  // Health check
  async healthCheck(): Promise<{ database: boolean; sportRadar: boolean }> {
    const [databaseHealth, sportRadarHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.sportRadarService.healthCheck(),
    ]);

    return {
      database: databaseHealth,
      sportRadar: sportRadarHealth,
    };
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.databaseService.findSeasons({ limit: 1 });
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}
