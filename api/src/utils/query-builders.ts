import { Prisma } from "@prisma/client";
import {
  CompetitorFilters,
  CompetitorInclude,
  CompetitorStatisticsFilters,
  PaginationParams,
  PlayerFilters,
  PlayerInclude,
  PlayerStatisticsFilters,
  SeasonFilters,
  SeasonInclude,
  StatisticsInclude,
} from "../types/api.types";

// Season Utilities
export function buildSeasonWhereClause(
  filters: SeasonFilters
): Prisma.SeasonWhereInput {
  const where: Prisma.SeasonWhereInput = {};

  if (filters.id) where.id = filters.id;
  if (filters.special_id) where.special_id = filters.special_id;
  if (filters.name)
    where.name = { contains: filters.name, mode: "insensitive" };
  if (filters.year) where.year = filters.year;
  if (filters.competition_id) where.competition_id = filters.competition_id;

  return where;
}

export function buildSeasonInclude(filters: SeasonFilters): SeasonInclude {
  const include: SeasonInclude = {};

  if (filters.include_competitors) {
    include.competitors = {
      include: {
        ...(filters.include_players && { players: true }),
        ...(filters.include_statistics && { statistics: true }),
      },
    };
  }

  return include;
}

// Competitor Utilities
export function buildCompetitorWhereClause(
  filters: CompetitorFilters
): Prisma.CompetitorWhereInput {
  const where: Prisma.CompetitorWhereInput = {};

  if (filters.id) where.id = filters.id;
  if (filters.special_id) where.special_id = filters.special_id;
  if (filters.name)
    where.name = { contains: filters.name, mode: "insensitive" };
  if (filters.short_name)
    where.short_name = { contains: filters.short_name, mode: "insensitive" };
  if (filters.abbreviation) where.abbreviation = filters.abbreviation;
  if (filters.gender) where.gender = filters.gender;
  if (filters.country)
    where.country = { contains: filters.country, mode: "insensitive" };
  if (filters.country_code) where.country_code = filters.country_code;
  if (filters.season_id) where.seasonId = filters.season_id;
  if (filters.season_special_id) {
    where.season = {
      special_id: filters.season_special_id,
    };
  }

  return where;
}

export function buildCompetitorInclude(
  filters: CompetitorFilters
): CompetitorInclude {
  const include: CompetitorInclude = {};

  if (filters.include_players) {
    include.players = {
      include: {
        ...(filters.include_statistics && { statistics: true }),
      },
    };
  }
  if (filters.include_statistics && !include.players) {
    include.statistics = true;
  }
  if (filters.include_season) {
    include.season = true;
  }

  return include;
}

// Player Utilities
export function buildPlayerWhereClause(
  filters: PlayerFilters
): Prisma.PlayerWhereInput {
  const where: Prisma.PlayerWhereInput = {};

  if (filters.id) where.id = filters.id;
  if (filters.special_id) where.special_id = filters.special_id;
  if (filters.name)
    where.name = { contains: filters.name, mode: "insensitive" };
  if (filters.competitor_id) where.competitorId = filters.competitor_id;

  // Build competitor filter separately
  const competitorFilter: Prisma.CompetitorWhereInput = {};
  if (filters.competitor_special_id)
    competitorFilter.special_id = filters.competitor_special_id;
  if (filters.season_id) competitorFilter.seasonId = filters.season_id;
  if (filters.season_special_id) {
    competitorFilter.season = {
      special_id: filters.season_special_id,
    };
  }

  if (Object.keys(competitorFilter).length > 0) {
    where.competitor = competitorFilter;
  }

  return where;
}

export function buildPlayerInclude(filters: PlayerFilters): PlayerInclude {
  const include: PlayerInclude = {};

  if (filters.include_competitor) {
    include.competitor = {
      include: {
        ...(filters.include_season && { season: true }),
      },
    };
  }
  if (filters.include_statistics) {
    include.statistics = true;
  }

  return include;
}

// Competitor Statistics Utilities
export function buildCompetitorStatisticsWhereClause(
  filters: CompetitorStatisticsFilters
): Prisma.StatistiqueWhereInput {
  const where: Prisma.StatistiqueWhereInput = {};

  if (filters.id) where.id = filters.id;
  if (filters.type)
    where.type = { contains: filters.type, mode: "insensitive" };
  if (filters.competitor_id) where.competitorId = filters.competitor_id;

  // Build competitor filter separately
  const competitorFilter: Prisma.CompetitorWhereInput = {};
  if (filters.competitor_special_id)
    competitorFilter.special_id = filters.competitor_special_id;
  if (filters.season_id) competitorFilter.seasonId = filters.season_id;
  if (filters.season_special_id) {
    competitorFilter.season = {
      special_id: filters.season_special_id,
    };
  }

  if (Object.keys(competitorFilter).length > 0) {
    where.competitor = competitorFilter;
  }

  return where;
}

export function buildCompetitorStatisticsInclude(
  filters: CompetitorStatisticsFilters
): StatisticsInclude {
  const include: StatisticsInclude = {};

  if (filters.include_competitor) {
    include.competitor = {
      include: {
        ...(filters.include_season && { season: true }),
      },
    };
  }

  return include;
}

// Player Statistics Utilities
export function buildPlayerStatisticsWhereClause(
  filters: PlayerStatisticsFilters
): Prisma.PlayerStatistiqueWhereInput {
  const where: Prisma.PlayerStatistiqueWhereInput = {};

  if (filters.id) where.id = filters.id;
  if (filters.type)
    where.type = { contains: filters.type, mode: "insensitive" };
  if (filters.player_id) where.playerId = filters.player_id;

  // Build nested player filter
  if (
    filters.player_special_id ||
    filters.competitor_id ||
    filters.competitor_special_id ||
    filters.season_id ||
    filters.season_special_id
  ) {
    const playerFilter: Prisma.PlayerWhereInput = {};

    if (filters.player_special_id) {
      playerFilter.special_id = filters.player_special_id;
    }

    // Build competitor filter if needed
    if (
      filters.competitor_id ||
      filters.competitor_special_id ||
      filters.season_id ||
      filters.season_special_id
    ) {
      const competitorFilter: Prisma.CompetitorWhereInput = {};

      if (filters.competitor_id) competitorFilter.id = filters.competitor_id;
      if (filters.competitor_special_id)
        competitorFilter.special_id = filters.competitor_special_id;
      if (filters.season_id) competitorFilter.seasonId = filters.season_id;
      if (filters.season_special_id) {
        competitorFilter.season = {
          special_id: filters.season_special_id,
        };
      }

      playerFilter.competitor = competitorFilter;
    }

    where.player = playerFilter;
  }

  return where;
}

export function buildPlayerStatisticsInclude(
  filters: PlayerStatisticsFilters
): StatisticsInclude {
  const include: StatisticsInclude = {};

  if (filters.include_player) {
    include.player = {
      include: {
        ...(filters.include_competitor && {
          competitor: {
            include: {
              ...(filters.include_season && { season: true }),
            },
          },
        }),
      },
    };
  }

  return include;
}

// Pagination Utilities
export function buildPagination(params: PaginationParams): {
  take?: number;
  skip?: number;
} {
  const pagination: { take?: number; skip?: number } = {};

  if (params.limit) pagination.take = params.limit;
  if (params.offset) pagination.skip = params.offset;

  return pagination;
}

// SportRadar ID Utilities
export function extractIdFromSportRadarId(
  sportRadarId: string,
  prefix: string
): string {
  return sportRadarId.replace(`${prefix}:`, "");
}

export function extractSeasonId(sportRadarId: string): string {
  return extractIdFromSportRadarId(sportRadarId, "sr:season");
}

export function extractCompetitorId(sportRadarId: string): string {
  return extractIdFromSportRadarId(sportRadarId, "sr:competitor");
}

export function extractPlayerId(sportRadarId: string): string {
  return extractIdFromSportRadarId(sportRadarId, "sr:player");
}

export function extractCompetitionId(sportRadarId: string): string {
  return extractIdFromSportRadarId(sportRadarId, "sr:competition");
}
