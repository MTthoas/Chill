import { Request, Response } from "express";
import { BusinessLogicService } from "../services";
import {
  CreateSeasonRequest,
  SeasonFilters,
  UpdateSeasonRequest,
} from "../types/api.types";
import {
  handleAsyncError,
  handleDatabaseError,
  handleSportRadarError,
  sendBadRequestResponse,
  sendCreatedResponse,
  sendDeletedResponse,
  sendNotFoundResponse,
  sendPaginatedResponse,
  sendSuccessResponse,
  sendUpdatedResponse,
} from "../utils/response";
import {
  createNotFoundError,
  isValidSeasonId,
  validateBooleanParam,
  validateNumberParam,
  validatePaginationParams,
} from "../utils/validation";

export class SeasonsController {
  private businessLogic: BusinessLogicService;

  constructor() {
    this.businessLogic = new BusinessLogicService();
  }

  // GET /seasons
  getSeasons = handleAsyncError(async (req: Request, res: Response) => {
    // Parse query parameters
    const pagination = validatePaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    if (pagination.error) {
      return sendBadRequestResponse(res, pagination.error);
    }

    const filters: SeasonFilters = {
      ...pagination,
      id: validateNumberParam(req.query.id as string),
      special_id: req.query.special_id as string,
      name: req.query.name as string,
      year: req.query.year as string,
      competition_id: req.query.competition_id as string,
      include_competitors: validateBooleanParam(
        req.query.include_competitors as string
      ),
      include_players: validateBooleanParam(
        req.query.include_players as string
      ),
      include_statistics: validateBooleanParam(
        req.query.include_statistics as string
      ),
    };

    try {
      const { seasons, total } = await this.businessLogic.getSeasons(filters);

      if (filters.limit || filters.offset !== undefined) {
        sendPaginatedResponse(
          res,
          seasons,
          total,
          filters.limit,
          filters.offset
        );
      } else {
        sendSuccessResponse(res, seasons);
      }
    } catch (error) {
      handleDatabaseError(error, res);
    }
  });

  // GET /seasons/:id
  getSeasonById = handleAsyncError(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return sendBadRequestResponse(res, "Invalid season ID");
    }

    const filters: SeasonFilters = {
      include_competitors: validateBooleanParam(
        req.query.include_competitors as string
      ),
      include_players: validateBooleanParam(
        req.query.include_players as string
      ),
      include_statistics: validateBooleanParam(
        req.query.include_statistics as string
      ),
    };

    try {
      const season = await this.businessLogic.getSeasonById(id, filters);

      if (!season) {
        return sendNotFoundResponse(
          res,
          createNotFoundError("Season", id).error
        );
      }

      sendSuccessResponse(res, season);
    } catch (error) {
      handleDatabaseError(error, res);
    }
  });

  // POST /seasons
  createSeason = handleAsyncError(async (req: Request, res: Response) => {
    const { special_id, name, start_date, end_date, year, competition_id } =
      req.body;

    // Validate required fields
    if (
      !special_id ||
      !name ||
      !start_date ||
      !end_date ||
      !year ||
      !competition_id
    ) {
      return sendBadRequestResponse(
        res,
        "Missing required fields: special_id, name, start_date, end_date, year, competition_id"
      );
    }

    if (!isValidSeasonId(special_id)) {
      return sendBadRequestResponse(
        res,
        "Invalid season ID format. Expected format: sr:season:XXXXXX"
      );
    }

    const seasonData: CreateSeasonRequest = {
      special_id,
      name,
      start_date,
      end_date,
      year,
      competition_id,
    };

    // Validate year is a valid number string
    if (isNaN(parseInt(year))) {
      return sendBadRequestResponse(res, "Year must be a valid number");
    }

    try {
      const season = await this.businessLogic.createSeason(seasonData);
      sendCreatedResponse(res, season);
    } catch (error) {
      handleDatabaseError(error, res);
    }
  });

  // POST /seasons/fetch/:seasonId
  createSeasonFromSportRadar = handleAsyncError(
    async (req: Request, res: Response) => {
      const seasonId = req.params.seasonId;

      if (!isValidSeasonId(seasonId)) {
        return sendBadRequestResponse(
          res,
          "Invalid season ID format. Expected format: sr:season:XXXXXX"
        );
      }

      const populate =
        validateBooleanParam(req.query.populate as string) || false;

      try {
        let result;

        if (populate) {
          result = await this.businessLogic.createSeasonAndPopulateData(
            seasonId
          );
        } else {
          result = await this.businessLogic.createSeasonFromSportRadar(
            seasonId
          );
        }

        sendCreatedResponse(
          res,
          result,
          `Season ${populate ? "and related data " : ""}created from SportRadar`
        );
      } catch (error) {
        handleSportRadarError(error, res);
      }
    }
  );

  // PUT /seasons/:id
  updateSeason = handleAsyncError(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return sendBadRequestResponse(res, "Invalid season ID");
    }

    const { name, start_date, end_date, year, competition_id } = req.body;

    if (!name && !start_date && !end_date && !year && !competition_id) {
      return sendBadRequestResponse(
        res,
        "At least one field must be provided for update"
      );
    }

    const updateData: UpdateSeasonRequest = {};
    if (name) updateData.name = name;
    if (start_date) updateData.start_date = start_date;
    if (end_date) updateData.end_date = end_date;
    if (year) {
      if (isNaN(parseInt(year))) {
        return sendBadRequestResponse(res, "Year must be a valid number");
      }
      updateData.year = year;
    }
    if (competition_id) updateData.competition_id = competition_id;

    try {
      const season = await this.businessLogic.updateSeason(id, updateData);

      if (!season) {
        return sendNotFoundResponse(
          res,
          createNotFoundError("Season", id).error
        );
      }

      sendUpdatedResponse(res, season);
    } catch (error) {
      handleDatabaseError(error, res);
    }
  });

  // DELETE /seasons/:id
  deleteSeason = handleAsyncError(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return sendBadRequestResponse(res, "Invalid season ID");
    }

    try {
      const deleted = await this.businessLogic.deleteSeason(id);

      if (!deleted) {
        return sendNotFoundResponse(
          res,
          createNotFoundError("Season", id).error
        );
      }

      sendDeletedResponse(res);
    } catch (error) {
      handleDatabaseError(error, res);
    }
  });

  // Health check for cleanup
  async cleanup(): Promise<void> {
    await this.businessLogic.cleanup();
  }
}
