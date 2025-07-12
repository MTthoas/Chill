import { SportRadarSeasonInfo } from "../types/api.types";

// SportRadar ID validation
export function isValidSportRadarId(id: string, prefix: string): boolean {
  return id.startsWith(`${prefix}:`) && id.length > prefix.length + 1;
}

export function isValidSeasonId(id: string): boolean {
  return isValidSportRadarId(id, "sr:season");
}

export function isValidCompetitorId(id: string): boolean {
  return isValidSportRadarId(id, "sr:competitor");
}

export function isValidPlayerId(id: string): boolean {
  return isValidSportRadarId(id, "sr:player");
}

export function isValidCompetitionId(id: string): boolean {
  return isValidSportRadarId(id, "sr:competition");
}

// Request validation
export function validatePaginationParams(
  limit?: string,
  offset?: string
): { limit?: number; offset?: number; error?: string } {
  const result: { limit?: number; offset?: number; error?: string } = {};

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 1000) {
      result.error = "Limit must be a positive number between 1 and 1000";
      return result;
    }
    result.limit = limitNum;
  }

  if (offset !== undefined) {
    const offsetNum = parseInt(offset, 10);
    if (isNaN(offsetNum) || offsetNum < 0) {
      result.error = "Offset must be a non-negative number";
      return result;
    }
    result.offset = offsetNum;
  }

  return result;
}

export function validateBooleanParam(value?: string): boolean | undefined {
  if (value === undefined) return undefined;
  return value.toLowerCase() === "true";
}

export function validateNumberParam(value?: string): number | undefined {
  if (value === undefined) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}

// SportRadar response validation
export function validateSeasonInfo(
  data: unknown
): data is SportRadarSeasonInfo {
  if (!data || typeof data !== "object") return false;

  const seasonData = data as Record<string, unknown>;

  return Boolean(
    typeof seasonData.id === "string" &&
      typeof seasonData.name === "string" &&
      typeof seasonData.start_date === "string" &&
      typeof seasonData.end_date === "string" &&
      typeof seasonData.year === "string" &&
      seasonData.competition &&
      typeof seasonData.competition === "object" &&
      (seasonData.competition as Record<string, unknown>).id &&
      typeof (seasonData.competition as Record<string, unknown>).id === "string"
  );
}

export function validateCompetitors(data: unknown): boolean {
  if (!Array.isArray(data)) return false;

  return data.every((competitor) => {
    if (!competitor || typeof competitor !== "object") return false;
    const comp = competitor as Record<string, unknown>;
    return typeof comp.id === "string" && typeof comp.name === "string";
  });
}

export function validatePlayers(data: unknown): boolean {
  if (!Array.isArray(data)) return false;

  return data.every((player) => {
    if (!player || typeof player !== "object") return false;
    const p = player as Record<string, unknown>;
    return typeof p.id === "string" && typeof p.name === "string";
  });
}

export function validateStatistics(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;

  const stats = data as Record<string, unknown>;
  return Boolean(stats.competitors && Array.isArray(stats.competitors));
}

// Error message helpers
export function createValidationError(
  field: string,
  message: string
): { error: string } {
  return { error: `${field}: ${message}` };
}

export function createNotFoundError(
  entity: string,
  identifier: string | number
): { error: string } {
  return { error: `${entity} not found with identifier: ${identifier}` };
}

export function createExternalApiError(
  service: string,
  message: string
): { error: string } {
  return { error: `${service} API error: ${message}` };
}
