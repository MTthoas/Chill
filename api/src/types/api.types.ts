// API Request/Response Types

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    count: number;
    limit?: number;
    offset?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface BaseFilters extends PaginationParams {
  id?: number;
}

// Season Types
export interface SeasonFilters extends BaseFilters {
  special_id?: string;
  name?: string;
  year?: string;
  competition_id?: string;
  include_competitors?: boolean;
  include_players?: boolean;
  include_statistics?: boolean;
}

export interface SeasonCreateRequest {
  // No body needed - fetches from external API
}

// Competitor Types
export interface CompetitorFilters extends BaseFilters {
  special_id?: string;
  name?: string;
  short_name?: string;
  abbreviation?: string;
  gender?: string;
  country?: string;
  country_code?: string;
  season_id?: number;
  season_special_id?: string;
  include_players?: boolean;
  include_statistics?: boolean;
  include_season?: boolean;
}

export interface CompetitorCreateRequest {
  seasonId: string;
}

// Player Types
export interface PlayerFilters extends BaseFilters {
  special_id?: string;
  name?: string;
  competitor_id?: number;
  competitor_special_id?: string;
  season_id?: number;
  season_special_id?: string;
  include_competitor?: boolean;
  include_statistics?: boolean;
  include_season?: boolean;
}

export interface PlayerCreateRequest {
  seasonId: string;
}

// Statistics Types
export interface CompetitorStatisticsFilters extends BaseFilters {
  type?: string;
  competitor_id?: number;
  competitor_special_id?: string;
  season_id?: number;
  season_special_id?: string;
  include_competitor?: boolean;
  include_season?: boolean;
}

export interface PlayerStatisticsFilters extends BaseFilters {
  type?: string;
  player_id?: number;
  player_special_id?: string;
  competitor_id?: number;
  competitor_special_id?: string;
  season_id?: number;
  season_special_id?: string;
  include_player?: boolean;
  include_competitor?: boolean;
  include_season?: boolean;
}

export interface PlayerStatisticsCreateRequest {
  seasonId: string;
  competitorId: string;
}

// SportRadar API Types
export interface SportRadarSeasonInfo {
  generated_at: string;
  season: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    year: string;
    competition_id: string;
    sport: {
      id: string;
      name: string;
    };
    category: {
      id: string;
      name: string;
      country_code: string;
    };
    competition: {
      id: string;
      name: string;
      gender: string;
    };
  };
}

export interface SportRadarCompetitor {
  id: string;
  name: string;
  short_name: string;
  abbreviation: string;
  gender: string;
  country?: string;
  country_code?: string;
}

export interface SportRadarPlayer {
  id: string;
  name: string;
  type?: string;
  date_of_birth?: string;
  nationality?: string;
  country_code?: string;
  height?: number;
  weight?: number;
  jersey_number?: number;
  preferred_foot?: string;
  place_of_birth?: string;
}

export interface SportRadarStatistics {
  [key: string]: number;
}

// Prisma Include Types
export interface SeasonInclude {
  competitors?:
    | boolean
    | {
        include?: {
          players?: boolean;
          statistics?: boolean;
        };
      };
}

export interface CompetitorInclude {
  players?:
    | boolean
    | {
        include?: {
          statistics?: boolean;
        };
      };
  statistics?: boolean;
  season?: boolean;
}

export interface PlayerInclude {
  competitor?:
    | boolean
    | {
        include?: {
          season?: boolean;
        };
      };
  statistics?: boolean;
}

export interface StatisticsInclude {
  competitor?:
    | boolean
    | {
        include?: {
          season?: boolean;
        };
      };
  player?:
    | boolean
    | {
        include?: {
          competitor?:
            | boolean
            | {
                include?: {
                  season?: boolean;
                };
              };
        };
      };
}

// Request Types for CRUD operations

// Season Request Types
export interface CreateSeasonRequest {
  special_id: string;
  name: string;
  start_date: string;
  end_date: string;
  year: string;
  competition_id: string;
}

export interface UpdateSeasonRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  year?: string;
  competition_id?: string;
}

// Competitor Request Types
export interface CreateCompetitorRequest {
  special_id: string;
  name: string;
  short_name: string;
  abbreviation: string;
  gender: string;
  country?: string;
  country_code?: string;
  seasonId: number;
}

export interface UpdateCompetitorRequest {
  name?: string;
  short_name?: string;
  abbreviation?: string;
  gender?: string;
  country?: string;
  country_code?: string;
  seasonId?: number;
}

// Player Request Types
export interface CreatePlayerRequest {
  special_id: string;
  name: string;
  competitorId: number;
}

export interface UpdatePlayerRequest {
  name?: string;
  competitorId?: number;
}

// Competitor Statistics Request Types
export interface CreateCompetitorStatisticsRequest {
  type: string;
  value: number;
  competitorId: number;
}

export interface UpdateCompetitorStatisticsRequest {
  type?: string;
  value?: number;
}

// Player Statistics Request Types
export interface CreatePlayerStatisticsRequest {
  type: string;
  value: number;
  playerId: number;
}

export interface UpdatePlayerStatisticsRequest {
  type?: string;
  value?: number;
}
