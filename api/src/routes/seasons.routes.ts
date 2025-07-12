import { Router } from "express";
import { SeasonsController } from "../controllers";

const router = Router();
const seasonsController = new SeasonsController();

// GET /api/seasons - Get all seasons with filtering
router.get("/", seasonsController.getSeasons);

// GET /api/seasons/:id - Get season by ID
router.get("/:id", seasonsController.getSeasonById);

// POST /api/seasons - Create a new season
router.post("/", seasonsController.createSeason);

// POST /api/seasons/fetch/:seasonId - Create season from SportRadar
router.post("/fetch/:seasonId", seasonsController.createSeasonFromSportRadar);

// PUT /api/seasons/:id - Update a season
router.put("/:id", seasonsController.updateSeason);

// DELETE /api/seasons/:id - Delete a season
router.delete("/:id", seasonsController.deleteSeason);

export default router;
