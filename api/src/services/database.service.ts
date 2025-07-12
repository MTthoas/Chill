import {
  Competitor,
  Player,
  PlayerStatistique,
  PrismaClient,
  Season,
  Statistique,
} from "@prisma/client";
import {
  CompetitorFilters,
  CompetitorInclude,
  CompetitorStatisticsFilters,
  CreateCompetitorRequest,
  CreateCompetitorStatisticsRequest,
  CreatePlayerRequest,
  CreatePlayerStatisticsRequest,
  CreateSeasonRequest,
  PlayerFilters,
  PlayerInclude,
  PlayerStatisticsFilters,
  SeasonFilters,
  SeasonInclude,
  StatisticsInclude,
  UpdateCompetitorRequest,
  UpdateCompetitorStatisticsRequest,
  UpdatePlayerRequest,
  UpdatePlayerStatisticsRequest,
  UpdateSeasonRequest,
} from "../types/api.types";
import {
  buildCompetitorInclude,
  buildCompetitorStatisticsInclude,
  buildCompetitorStatisticsWhereClause,
  buildCompetitorWhereClause,
  buildPagination,
  buildPlayerInclude,
  buildPlayerStatisticsInclude,
  buildPlayerStatisticsWhereClause,
  buildPlayerWhereClause,
  buildSeasonInclude,
  buildSeasonWhereClause,
  extractCompetitionId,
  extractCompetitorId,
  extractPlayerId,
} from "../utils/query-builders";

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // Season operations
  async findSeasons(filters: SeasonFilters) {
    const where = buildSeasonWhereClause(filters);
    const include = buildSeasonInclude(filters);
    const pagination = buildPagination(filters);

    const [seasons, total] = await Promise.all([
      this.prisma.season.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        ...pagination,
      }),
      this.prisma.season.count({ where }),
    ]);

    return { seasons, total };
  }

  async findSeasonById(id: number, include?: SeasonInclude) {
    return this.prisma.season.findUnique({
      where: { id },
      include,
    });
  }

  async findSeasonBySpecialId(special_id: string, include?: SeasonInclude) {
    return this.prisma.season.findUnique({
      where: { special_id },
      include,
    });
  }

  async createSeason(data: CreateSeasonRequest): Promise<Season> {
    return this.prisma.season.create({
      data: {
        special_id: data.special_id,
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        year: data.year,
        competition_id: data.competition_id,
      },
    });
  }

  async upsertSeason(data: CreateSeasonRequest): Promise<Season> {
    return this.prisma.season.upsert({
      where: { special_id: data.special_id },
      update: {
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        year: data.year,
        competition_id: data.competition_id,
      },
      create: {
        special_id: data.special_id,
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        year: data.year,
        competition_id: data.competition_id,
      },
    });
  }

  async updateSeason(
    id: number,
    data: UpdateSeasonRequest
  ): Promise<Season | null> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.start_date !== undefined)
        updateData.start_date = data.start_date;
      if (data.end_date !== undefined) updateData.end_date = data.end_date;
      if (data.year !== undefined) updateData.year = data.year;
      if (data.competition_id !== undefined)
        updateData.competition_id = data.competition_id;

      return await this.prisma.season.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      return null;
    }
  }

  async deleteSeason(id: number): Promise<boolean> {
    try {
      await this.prisma.season.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Competitor operations
  async findCompetitors(filters: CompetitorFilters) {
    const where = buildCompetitorWhereClause(filters);
    const include = buildCompetitorInclude(filters);
    const pagination = buildPagination(filters);

    const [competitors, total] = await Promise.all([
      this.prisma.competitor.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        ...pagination,
      }),
      this.prisma.competitor.count({ where }),
    ]);

    return { competitors, total };
  }

  async findCompetitorById(id: number, include?: CompetitorInclude) {
    return this.prisma.competitor.findUnique({
      where: { id },
      include,
    });
  }

  async findCompetitorBySpecialId(
    special_id: string,
    include?: CompetitorInclude
  ) {
    return this.prisma.competitor.findUnique({
      where: { special_id },
      include,
    });
  }

  async createCompetitor(data: CreateCompetitorRequest): Promise<Competitor> {
    return this.prisma.competitor.create({
      data,
    });
  }

  async upsertCompetitor(data: CreateCompetitorRequest): Promise<Competitor> {
    return this.prisma.competitor.upsert({
      where: { special_id: data.special_id },
      update: {
        name: data.name,
        short_name: data.short_name,
        abbreviation: data.abbreviation,
        gender: data.gender,
        country: data.country,
        country_code: data.country_code,
      },
      create: data,
    });
  }

  async updateCompetitor(
    id: number,
    data: UpdateCompetitorRequest
  ): Promise<Competitor | null> {
    try {
      return await this.prisma.competitor.update({
        where: { id },
        data,
      });
    } catch (error) {
      return null;
    }
  }

  async deleteCompetitor(id: number): Promise<boolean> {
    try {
      await this.prisma.competitor.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Player operations
  async findPlayers(filters: PlayerFilters) {
    const where = buildPlayerWhereClause(filters);
    const include = buildPlayerInclude(filters);
    const pagination = buildPagination(filters);

    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        ...pagination,
      }),
      this.prisma.player.count({ where }),
    ]);

    return { players, total };
  }

  async findPlayerById(id: number, include?: PlayerInclude) {
    return this.prisma.player.findUnique({
      where: { id },
      include,
    });
  }

  async findPlayerBySpecialId(special_id: string, include?: PlayerInclude) {
    return this.prisma.player.findUnique({
      where: { special_id },
      include,
    });
  }

  async createPlayer(data: CreatePlayerRequest): Promise<Player> {
    return this.prisma.player.create({
      data,
    });
  }

  async upsertPlayer(data: CreatePlayerRequest): Promise<Player> {
    return this.prisma.player.upsert({
      where: { special_id: data.special_id },
      update: {
        name: data.name,
      },
      create: data,
    });
  }

  async updatePlayer(
    id: number,
    data: UpdatePlayerRequest
  ): Promise<Player | null> {
    try {
      return await this.prisma.player.update({
        where: { id },
        data,
      });
    } catch (error) {
      return null;
    }
  }

  async deletePlayer(id: number): Promise<boolean> {
    try {
      await this.prisma.player.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Competitor Statistics operations
  async findCompetitorStatistics(filters: CompetitorStatisticsFilters) {
    const where = buildCompetitorStatisticsWhereClause(filters);
    const include = buildCompetitorStatisticsInclude(filters);
    const pagination = buildPagination(filters);

    const [statistics, total] = await Promise.all([
      this.prisma.statistique.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        ...pagination,
      }),
      this.prisma.statistique.count({ where }),
    ]);

    return { statistics, total };
  }

  async findCompetitorStatisticsById(id: number, include?: StatisticsInclude) {
    return this.prisma.statistique.findUnique({
      where: { id },
      include,
    });
  }

  async createCompetitorStatistics(
    data: CreateCompetitorStatisticsRequest
  ): Promise<Statistique> {
    return this.prisma.statistique.create({
      data,
    });
  }

  async updateCompetitorStatistics(
    id: number,
    data: UpdateCompetitorStatisticsRequest
  ): Promise<Statistique | null> {
    try {
      const updateData: any = {};
      if (data.type !== undefined) updateData.type = data.type;
      if (data.value !== undefined) updateData.value = data.value;
      // Note: competitorId cannot be updated as it's a foreign key relation

      return await this.prisma.statistique.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      return null;
    }
  }

  async deleteCompetitorStatistics(id: number): Promise<boolean> {
    try {
      await this.prisma.statistique.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Player Statistics operations
  async findPlayerStatistics(filters: PlayerStatisticsFilters) {
    const where = buildPlayerStatisticsWhereClause(filters);
    const include = buildPlayerStatisticsInclude(filters);
    const pagination = buildPagination(filters);

    const [statistics, total] = await Promise.all([
      this.prisma.playerStatistique.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        ...pagination,
      }),
      this.prisma.playerStatistique.count({ where }),
    ]);

    return { statistics, total };
  }

  async findPlayerStatisticsById(id: number, include?: StatisticsInclude) {
    return this.prisma.playerStatistique.findUnique({
      where: { id },
      include,
    });
  }

  async createPlayerStatistics(
    data: CreatePlayerStatisticsRequest
  ): Promise<PlayerStatistique> {
    return this.prisma.playerStatistique.create({
      data,
    });
  }

  async updatePlayerStatistics(
    id: number,
    data: UpdatePlayerStatisticsRequest
  ): Promise<PlayerStatistique | null> {
    try {
      const updateData: any = {};
      if (data.type !== undefined) updateData.type = data.type;
      if (data.value !== undefined) updateData.value = data.value;
      // Note: playerId cannot be updated as it's a foreign key relation

      return await this.prisma.playerStatistique.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      return null;
    }
  }

  async deletePlayerStatistics(id: number): Promise<boolean> {
    try {
      await this.prisma.playerStatistique.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Utility methods for SportRadar integration
  async createSeasonFromSportRadar(
    seasonInfo: any,
    seasonId: string
  ): Promise<Season> {
    const seasonData: CreateSeasonRequest = {
      special_id: seasonId,
      name: seasonInfo.name,
      start_date: seasonInfo.start_date,
      end_date: seasonInfo.end_date,
      year: seasonInfo.year,
      competition_id: extractCompetitionId(seasonInfo.competition.id),
    };

    return this.upsertSeason(seasonData);
  }

  async createCompetitorFromSportRadar(
    competitor: any,
    seasonId: number
  ): Promise<Competitor> {
    const competitorData: CreateCompetitorRequest = {
      special_id: extractCompetitorId(competitor.id),
      name: competitor.name,
      short_name: competitor.short_name,
      abbreviation: competitor.abbreviation,
      gender: competitor.gender,
      country: competitor.country,
      country_code: competitor.country_code,
      seasonId,
    };

    return this.upsertCompetitor(competitorData);
  }

  async createPlayerFromSportRadar(
    player: any,
    competitorId: number
  ): Promise<Player> {
    const playerData: CreatePlayerRequest = {
      special_id: extractPlayerId(player.id),
      name: player.name,
      competitorId,
    };

    return this.upsertPlayer(playerData);
  }
}
