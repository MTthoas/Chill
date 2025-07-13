"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Helper function to fetch season info from SportRadar API
async function fetchSeasonInfo(seasonId) {
    const response = await fetch(`https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/info.json`, {
        method: "GET",
        headers: {
            accept: "application/json",
            "x-api-key": process.env.SPORTRADAR_API_KEY || "",
        },
    });
    if (!response.ok) {
        throw new Error(`SportRadar API error: ${response.status}`);
    }
    const data = await response.json();
    // Check if the API returned an error message (wrong identifier)
    if (data.message) {
        throw new Error(`Season not found: ${data.message}`);
    }
    return data;
}
// Season Info route
app.get("/seasons/:seasonId/info", async (req, res) => {
    const { seasonId } = req.params;
    try {
        const seasonInfo = await fetchSeasonInfo(seasonId);
        res.json(seasonInfo);
    }
    catch (error) {
        console.error("Error fetching season info:", error);
        if (error instanceof Error && error.message.includes("Season not found")) {
            res.status(404).json({ error: error.message });
        }
        else {
            res
                .status(500)
                .json({ error: "Failed to fetch season info from SportRadar API" });
        }
    }
});
// CRUD Season
app.get("/seasons", async (req, res) => {
    try {
        const { id, special_id, name, year, competition_id, include_competitors, include_players, include_statistics, limit, offset, } = req.query;
        // Build the where clause dynamically
        const where = {};
        if (id)
            where.id = parseInt(id);
        if (special_id)
            where.special_id = special_id;
        if (name)
            where.name = { contains: name, mode: "insensitive" };
        if (year)
            where.year = year;
        if (competition_id)
            where.competition_id = competition_id;
        // Build the include clause dynamically
        const include = {};
        if (include_competitors === "true") {
            include.competitors = {
                include: {
                    ...(include_players === "true" && { players: true }),
                    ...(include_statistics === "true" && { statistics: true }),
                },
            };
        }
        // Build pagination
        const pagination = {};
        if (limit)
            pagination.take = parseInt(limit);
        if (offset)
            pagination.skip = parseInt(offset);
        const seasons = await prisma.season.findMany({
            where,
            include,
            ...pagination,
            orderBy: { id: "desc" },
        });
        res.json({
            data: seasons,
            count: seasons.length,
            filters: { id, special_id, name, year, competition_id },
            includes: { include_competitors, include_players, include_statistics },
        });
    }
    catch (error) {
        console.error("Error fetching seasons:", error);
        res.status(500).json({ error: "Failed to fetch seasons" });
    }
});
app.post("/seasons", async (req, res) => {
    try {
        // Fetch seasons from SportRadar API
        const response = await fetch("https://api.sportradar.com/soccer/trial/v4/en/seasons.json", {
            method: "GET",
            headers: {
                accept: "application/json",
                "x-api-key": process.env.SPORTRADAR_API_KEY || "",
            },
        });
        if (!response.ok) {
            throw new Error(`SportRadar API error: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched seasons data:", data);
        // Create seasons in database from API data
        const seasons = [];
        for (const seasonData of data.seasons) {
            // Extract only the ID part from "sr:season:92261" -> "92261"
            const seasonId = seasonData.id.replace("sr:season:", "");
            // Extract only the ID part from "sr:competition:1" -> "1"
            const competitionId = seasonData.competition_id.replace("sr:competition:", "");
            const season = await prisma.season.upsert({
                where: {
                    special_id: String(seasonId),
                },
                update: {
                    name: seasonData.name,
                    start_date: new Date(seasonData.start_date + "T00:00:00.000Z"),
                    end_date: new Date(seasonData.end_date + "T23:59:59.999Z"),
                    year: seasonData.year,
                    competition_id: competitionId,
                },
                create: {
                    name: seasonData.name,
                    special_id: String(seasonId),
                    start_date: new Date(seasonData.start_date + "T00:00:00.000Z"),
                    end_date: new Date(seasonData.end_date + "T23:59:59.999Z"),
                    year: seasonData.year,
                    competition_id: competitionId,
                },
            });
            seasons.push(season);
        }
        res.json(seasons);
    }
    catch (error) {
        console.error("Error fetching seasons:", error);
        res
            .status(500)
            .json({ error: "Failed to fetch seasons from SportRadar API" });
    }
});
// CRUD Competitor
app.get("/competitors", async (req, res) => {
    console.log("Fetching competitors with filters:", req.query);
    try {
        const { id, special_id, name, short_name, abbreviation, gender, country, country_code, season_id, season_special_id, include_players, include_statistics, include_season, limit, offset, } = req.query;
        // Build the where clause dynamically
        const where = {};
        if (id)
            where.id = Number(id);
        if (special_id)
            where.special_id = String(special_id);
        if (name)
            where.name = { contains: String(name), mode: "insensitive" };
        if (short_name)
            where.short_name = { contains: String(short_name), mode: "insensitive" };
        if (abbreviation)
            where.abbreviation = String(abbreviation);
        if (gender)
            where.gender = String(gender);
        if (country)
            where.country = { contains: String(country), mode: "insensitive" };
        if (country_code)
            where.country_code = String(country_code);
        if (season_id)
            where.seasonId = Number(season_id);
        if (season_special_id) {
            where.season = { special_id: String(season_special_id) };
        }
        console.log(req.query);
        // Build the include clause dynamically
        const include = {};
        if (include_players === "true") {
            include.players = {
                include: {
                    ...(include_statistics === "true" && { statistics: true }),
                },
            };
        }
        if (include_statistics === "true" && !include.players) {
            include.statistics = true;
        }
        if (include_season === "true") {
            include.season = true;
        }
        // Build pagination
        const pagination = {};
        if (limit)
            pagination.take = Number(limit);
        if (offset)
            pagination.skip = Number(offset);
        const competitors = await prisma.competitor.findMany({
            where,
            include,
            ...pagination,
            orderBy: { id: "desc" },
        });
        res.json({
            data: competitors,
            count: competitors.length,
            filters: {
                id,
                special_id,
                name,
                short_name,
                abbreviation,
                gender,
                country,
                country_code,
                season_id,
                season_special_id,
            },
            includes: { include_players, include_statistics, include_season },
        });
    }
    catch (error) {
        console.error("Error fetching competitors:", error);
        res.status(500).json({ error: "Failed to fetch competitors" });
    }
});
app.post("/competitors", async (req, res) => {
    const { seasonId } = req.body;
    console.log("Fetching competitors for season ID:", seasonId);
    try {
        // First, verify that the season exists using external API call
        const seasonInfo = await fetchSeasonInfo(seasonId);
        console.log("Season info validated:", seasonInfo.season);
        // Wait 1 second to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // Use the seasonId for the SportRadar API call
        const response = await fetch(`https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/competitors.json`, {
            method: "GET",
            headers: {
                accept: "application/json",
                "x-api-key": process.env.SPORTRADAR_API_KEY || "",
            },
        });
        if (!response.ok) {
            throw new Error(`SportRadar API error: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched competitors data:", data);
        // Find the local season by special_id (convert to string)
        const localSeason = await prisma.season.findUnique({
            where: { special_id: String(seasonId) },
        });
        if (!localSeason) {
            return res.status(404).json({
                error: "Season not found in local database. Please create the season first using POST /seasons",
            });
        }
        // Create competitors in database from API data
        const competitors = [];
        for (const competitorData of data.season_competitors) {
            // Extract only the ID part from "sr:competitor:3" -> "3"
            const competitorId = competitorData.id.replace("sr:competitor:", "");
            const competitor = await prisma.competitor.upsert({
                where: {
                    special_id: competitorId,
                },
                update: {
                    name: competitorData.name,
                    short_name: competitorData.short_name,
                    abbreviation: competitorData.abbreviation,
                    gender: competitorData.gender,
                },
                create: {
                    name: competitorData.name,
                    short_name: competitorData.short_name,
                    abbreviation: competitorData.abbreviation,
                    gender: competitorData.gender,
                    seasonId: localSeason.id, // Use the local database season ID
                    special_id: competitorId,
                },
            });
            competitors.push(competitor);
        }
        res.json(competitors);
    }
    catch (error) {
        console.error("Error fetching competitors:", error);
        if (error instanceof Error && error.message.includes("Season not found")) {
            res.status(404).json({ error: error.message });
        }
        else {
            res
                .status(500)
                .json({ error: "Failed to fetch competitors from SportRadar API" });
        }
    }
});
// CRUD Player
app.get("/players", async (req, res) => {
    try {
        const { id, special_id, name, competitor_id, competitor_special_id, season_id, season_special_id, include_competitor, include_statistics, include_season, limit, offset, } = req.query;
        // Build the where clause dynamically
        const where = {};
        if (id)
            where.id = parseInt(id);
        if (special_id)
            where.special_id = special_id;
        if (name)
            where.name = { contains: name, mode: "insensitive" };
        if (competitor_id)
            where.competitorId = parseInt(competitor_id);
        if (competitor_special_id) {
            where.competitor = {
                special_id: competitor_special_id,
            };
        }
        if (season_id || season_special_id) {
            where.competitor = {
                ...where.competitor,
                ...(season_id && { seasonId: parseInt(season_id) }),
                ...(season_special_id && {
                    season: { special_id: season_special_id },
                }),
            };
        }
        // Build the include clause dynamically
        const include = {};
        if (include_competitor === "true") {
            include.competitor = {
                include: {
                    ...(include_season === "true" && { season: true }),
                },
            };
        }
        if (include_statistics === "true") {
            include.statistics = true;
        }
        // Build pagination
        const pagination = {};
        if (limit)
            pagination.take = parseInt(limit);
        if (offset)
            pagination.skip = parseInt(offset);
        const players = await prisma.player.findMany({
            where,
            include,
            ...pagination,
            orderBy: { id: "desc" },
        });
        res.json({
            data: players,
            count: players.length,
            filters: {
                id,
                special_id,
                name,
                competitor_id,
                competitor_special_id,
                season_id,
                season_special_id,
            },
            includes: { include_competitor, include_statistics, include_season },
        });
    }
    catch (error) {
        console.error("Error fetching players:", error);
        res.status(500).json({ error: "Failed to fetch players" });
    }
});
app.post("/players", async (req, res) => {
    const { seasonId } = req.body;
    console.log("Fetching players for season ID:", seasonId);
    try {
        // First, verify that the season exists using helper function
        const seasonInfo = await fetchSeasonInfo(seasonId);
        console.log("Season info validated:", seasonInfo.season);
        // Wait 2 second to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // Fetch players with competitor assignments from SportRadar API
        const playersResponse = await fetch(`https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/competitor_players.json`, {
            method: "GET",
            headers: {
                accept: "application/json",
                "x-api-key": process.env.SPORTRADAR_API_KEY || "",
            },
        });
        if (!playersResponse.ok) {
            throw new Error(`SportRadar API error: ${playersResponse.status}`);
        }
        const playersData = await playersResponse.json();
        console.log("Fetched players data:", playersData);
        // Find the local season by special_id
        const localSeason = await prisma.season.findUnique({
            where: { special_id: String(seasonId) },
        });
        if (!localSeason) {
            return res.status(404).json({
                error: "Season not found in local database. Please create the season first using POST /seasons",
            });
        }
        // Create players with competitor assignments
        const players = [];
        for (const competitorData of playersData.season_competitor_players) {
            // Extract competitor ID
            const competitorId = competitorData.id.replace("sr:competitor:", "");
            // Find the local competitor
            const localCompetitor = await prisma.competitor.findUnique({
                where: { special_id: competitorId },
            });
            if (!localCompetitor) {
                console.warn(`Competitor with special_id ${competitorId} not found. Skipping players for ${competitorData.name}`);
                continue;
            }
            // Create players for this competitor
            for (const playerData of competitorData.players) {
                // Extract player ID
                const playerId = playerData.id.replace("sr:player:", "");
                const player = await prisma.player.upsert({
                    where: {
                        special_id: playerId,
                    },
                    update: {
                        name: playerData.name,
                        // Note: Only updating fields that exist in the Prisma schema
                    },
                    create: {
                        name: playerData.name,
                        special_id: playerId,
                        competitorId: localCompetitor.id,
                    },
                });
                players.push(player);
            }
        }
        res.json({
            season: seasonInfo.season,
            players: players,
            message: `Successfully created/updated ${players.length} players with competitor assignments.`,
        });
    }
    catch (error) {
        console.error("Error fetching players:", error);
        if (error instanceof Error && error.message.includes("Season not found")) {
            res.status(404).json({ error: error.message });
        }
        else {
            res
                .status(500)
                .json({ error: "Failed to fetch players from SportRadar API" });
        }
    }
});
// CRUD Player Statistics
app.post("/player-statistics", async (req, res) => {
    const { seasonId, competitorId } = req.body;
    console.log("Fetching player statistics for season ID:", seasonId, "and competitor ID:", competitorId);
    try {
        // First, verify that the season exists using helper function
        const seasonInfo = await fetchSeasonInfo(seasonId);
        console.log("Season info validated:", seasonInfo.season);
        // Wait 1 second to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Fetch player statistics from SportRadar API
        const statisticsResponse = await fetch(`https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/competitors/sr%3Acompetitor%3A${competitorId}/statistics.json`, {
            method: "GET",
            headers: {
                accept: "application/json",
                "x-api-key": process.env.SPORTRADAR_API_KEY || "",
            },
        });
        if (!statisticsResponse.ok) {
            throw new Error(`SportRadar API error: ${statisticsResponse.status}`);
        }
        const statisticsData = await statisticsResponse.json();
        console.log("Fetched statistics data:", statisticsData);
        // Find the local season and competitor
        const localSeason = await prisma.season.findUnique({
            where: { special_id: String(seasonId) },
        });
        if (!localSeason) {
            return res.status(404).json({
                error: "Season not found in local database. Please create the season first using POST /seasons",
            });
        }
        const localCompetitor = await prisma.competitor.findUnique({
            where: { special_id: String(competitorId) },
        });
        if (!localCompetitor) {
            return res.status(404).json({
                error: "Competitor not found in local database. Please create the competitor first using POST /competitors",
            });
        }
        // Create/update competitor statistics
        const competitorStats = [];
        if (statisticsData.competitor.statistics) {
            for (const [statType, statValue] of Object.entries(statisticsData.competitor.statistics)) {
                // Check if statistic already exists
                const existingStat = await prisma.statistique.findFirst({
                    where: {
                        competitorId: localCompetitor.id,
                        type: statType,
                    },
                });
                let stat;
                if (existingStat) {
                    // Update existing statistic
                    stat = await prisma.statistique.update({
                        where: { id: existingStat.id },
                        data: { value: Number(statValue) },
                    });
                }
                else {
                    // Create new statistic
                    stat = await prisma.statistique.create({
                        data: {
                            type: statType,
                            value: Number(statValue),
                            competitorId: localCompetitor.id,
                        },
                    });
                }
                competitorStats.push(stat);
            }
        }
        // Create/update player statistics
        const playerStats = [];
        if (statisticsData.competitor.players) {
            for (const playerData of statisticsData.competitor.players) {
                // Extract player ID
                const playerId = playerData.id.replace("sr:player:", "");
                // Find the local player
                const localPlayer = await prisma.player.findUnique({
                    where: { special_id: playerId },
                });
                if (!localPlayer) {
                    console.warn(`Player with special_id ${playerId} not found. Skipping statistics for ${playerData.name}`);
                    continue;
                }
                // Create player statistics
                if (playerData.statistics) {
                    for (const [statType, statValue] of Object.entries(playerData.statistics)) {
                        // Check if statistic already exists
                        const existingStat = await prisma.playerStatistique.findFirst({
                            where: {
                                playerId: localPlayer.id,
                                type: statType,
                            },
                        });
                        let stat;
                        if (existingStat) {
                            // Update existing statistic
                            stat = await prisma.playerStatistique.update({
                                where: { id: existingStat.id },
                                data: { value: Number(statValue) },
                            });
                        }
                        else {
                            // Create new statistic
                            stat = await prisma.playerStatistique.create({
                                data: {
                                    type: statType,
                                    value: Number(statValue),
                                    playerId: localPlayer.id,
                                },
                            });
                        }
                        playerStats.push(stat);
                    }
                }
            }
        }
        res.json({
            season: seasonInfo.season,
            competitor: statisticsData.competitor,
            competitorStatistics: competitorStats,
            playerStatistics: playerStats,
            message: `Successfully created/updated ${competitorStats.length} competitor statistics and ${playerStats.length} player statistics.`,
        });
    }
    catch (error) {
        console.error("Error fetching player statistics:", error);
        if (error instanceof Error && error.message.includes("Season not found")) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({
                error: "Failed to fetch player statistics from SportRadar API",
            });
        }
    }
});
// Update Competitor Statistics for a Season
app.post("/season-statistics", async (req, res) => {
    const { seasonId } = req.body;
    if (!seasonId) {
        return res.status(400).json({ error: "seasonId is required" });
    }
    try {
        // Vérifie que la saison existe
        const localSeason = await prisma.season.findUnique({
            where: { special_id: String(seasonId) },
            include: { competitors: true },
        });
        if (!localSeason) {
            return res.status(404).json({
                error: "Season not found in local database. Please create the season first.",
            });
        }
        // --- AJOUT : Importer tous les joueurs de la saison si besoin ---
        console.log(`[season-statistics] Import des joueurs pour la saison ${seasonId}`);
        const playersResponse = await fetch(`https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/competitor_players.json`, {
            method: "GET",
            headers: {
                accept: "application/json",
                "x-api-key": process.env.SPORTRADAR_API_KEY || "",
            },
        });
        if (playersResponse.ok) {
            const playersData = await playersResponse.json();
            for (const competitorData of playersData.season_competitor_players) {
                const competitorId = competitorData.id.replace("sr:competitor:", "");
                const localCompetitor = await prisma.competitor.findUnique({
                    where: { special_id: competitorId },
                });
                if (!localCompetitor) {
                    console.warn(`[season-statistics] Competitor ${competitorId} non trouvé en base, skip joueurs.`);
                    continue;
                }
                for (const playerData of competitorData.players) {
                    const playerId = playerData.id.replace("sr:player:", "");
                    const upserted = await prisma.player.upsert({
                        where: { special_id: playerId },
                        update: { name: playerData.name },
                        create: {
                            name: playerData.name,
                            special_id: playerId,
                            competitorId: localCompetitor.id,
                        },
                    });
                    console.log(`[season-statistics] Joueur importé/upserté: ${playerData.name} (${playerId}) pour competitor ${competitorId}`);
                }
            }
        }
        else {
            console.error(`[season-statistics] Erreur lors de la récupération des joueurs: ${playersResponse.status}`);
        }
        // --- FIN AJOUT ---
        const results = [];
        // Fonction utilitaire pour sleep
        function sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }
        // Parallélisation contrôlée avec Promise.all et sleep entre chaque appel
        await Promise.all(localSeason.competitors.map(async (competitor, idx) => {
            // Ajoute un délai progressif pour chaque appel (ex: 1200ms entre chaque)
            await sleep(idx * 1200);
            console.log(`Updating statistics for competitor ${competitor.name} (${competitor.special_id}) in season ${seasonId}`);
            const competitorId = competitor.special_id;
            // Appel à l'API SportRadar pour récupérer les stats de l'équipe
            const statisticsResponse = await fetch(`https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/competitors/sr%3Acompetitor%3A${competitorId}/statistics.json`, {
                method: "GET",
                headers: {
                    accept: "application/json",
                    "x-api-key": process.env.SPORTRADAR_API_KEY || "",
                },
            });
            if (!statisticsResponse.ok) {
                console.error(`Erreur SportRadar pour competitor ${competitorId} saison ${seasonId}: ${statisticsResponse.status}`);
                results.push({
                    competitorId,
                    error: `SportRadar API error: ${statisticsResponse.status}`,
                });
                return;
            }
            const statisticsData = await statisticsResponse.json();
            // Update competitor statistics
            const competitorStats = [];
            if (statisticsData.competitor?.statistics) {
                for (const [statType, statValue] of Object.entries(statisticsData.competitor.statistics)) {
                    const existingStat = await prisma.statistique.findFirst({
                        where: {
                            competitorId: competitor.id,
                            type: statType,
                        },
                    });
                    let stat;
                    if (existingStat) {
                        stat = await prisma.statistique.update({
                            where: { id: existingStat.id },
                            data: { value: Number(statValue) },
                        });
                    }
                    else {
                        stat = await prisma.statistique.create({
                            data: {
                                type: statType,
                                value: Number(statValue),
                                competitorId: competitor.id,
                            },
                        });
                    }
                    competitorStats.push(stat);
                }
            }
            // Update player statistics
            const playerStats = [];
            if (statisticsData.competitor?.players) {
                console.log(`Updating statistics for players in competitor ${competitorId}`);
                for (const playerData of statisticsData.competitor.players) {
                    const playerId = playerData.id.replace("sr:player:", "");
                    const localPlayer = await prisma.player.findUnique({
                        where: { special_id: playerId },
                    });
                    if (!localPlayer) {
                        console.warn(`[season-statistics] Joueur ${playerId} non trouvé en base, skip stats.`);
                        continue;
                    }
                    if (playerData.statistics) {
                        for (const [statType, statValue] of Object.entries(playerData.statistics)) {
                            const existingStat = await prisma.playerStatistique.findFirst({
                                where: {
                                    playerId: localPlayer.id,
                                    type: statType,
                                },
                            });
                            let stat;
                            if (existingStat) {
                                stat = await prisma.playerStatistique.update({
                                    where: { id: existingStat.id },
                                    data: { value: Number(statValue) },
                                });
                            }
                            else {
                                stat = await prisma.playerStatistique.create({
                                    data: {
                                        type: statType,
                                        value: Number(statValue),
                                        playerId: localPlayer.id,
                                    },
                                });
                            }
                            playerStats.push(stat);
                        }
                    }
                    else {
                        console.warn(`[season-statistics] Pas de statistiques pour joueur ${playerData.name} (${playerId})`);
                    }
                }
            }
            results.push({
                competitorId,
                competitorStatsCount: competitorStats.length,
                playerStatsCount: playerStats.length,
            });
        }));
        res.json({
            seasonId,
            updated: results,
            message: "Statistiques mises à jour pour toutes les équipes de la saison.",
        });
    }
    catch (error) {
        console.error("Error updating season statistics:", error);
        res.status(500).json({ error: "Failed to update season statistics" });
    }
});
// GET Competitor Statistics
app.get("/competitor-statistics", async (req, res) => {
    try {
        const { id, type, competitor_id, competitor_special_id, season_id, season_special_id, include_competitor, include_season, limit, offset, } = req.query;
        // Build the where clause dynamically
        const where = {};
        if (id)
            where.id = parseInt(id);
        if (type)
            where.type = { contains: type, mode: "insensitive" };
        if (competitor_id)
            where.competitorId = parseInt(competitor_id);
        if (competitor_special_id) {
            where.competitor = {
                special_id: competitor_special_id,
            };
        }
        if (season_id || season_special_id) {
            where.competitor = {
                ...where.competitor,
                ...(season_id && { seasonId: parseInt(season_id) }),
                ...(season_special_id && {
                    season: { special_id: season_special_id },
                }),
            };
        }
        // Build the include clause dynamically
        const include = {};
        if (include_competitor === "true") {
            include.competitor = {
                include: {
                    ...(include_season === "true" && { season: true }),
                },
            };
        }
        // Build pagination
        const pagination = {};
        if (limit)
            pagination.take = parseInt(limit);
        if (offset)
            pagination.skip = parseInt(offset);
        const statistics = await prisma.statistique.findMany({
            where,
            include,
            ...pagination,
            orderBy: { id: "desc" },
        });
        res.json({
            data: statistics,
            count: statistics.length,
            filters: {
                id,
                type,
                competitor_id,
                competitor_special_id,
                season_id,
                season_special_id,
            },
            includes: { include_competitor, include_season },
        });
    }
    catch (error) {
        console.error("Error fetching competitor statistics:", error);
        res.status(500).json({ error: "Failed to fetch competitor statistics" });
    }
});
// Récupérer toutes les statistiques d'une équipe pour une compétition
app.get("/competitors/:competitorId/seasons/:seasonId/statistics", async (req, res) => {
    const { competitorId, seasonId } = req.params;
    try {
        // On récupère toutes les statistiques du competitor pour la saison donnée
        const competitor = await prisma.competitor.findUnique({
            where: { id: Number(competitorId) },
            include: {
                statistics: true,
                competitorStatsAdvices: true,
                season: true,
                players: {
                    include: {
                        statistics: true,
                    },
                },
            },
        });
        if (!competitor) {
            return res.status(404).json({ error: "Competitor not found" });
        }
        // Vérifie que la saison correspond
        if (competitor.season.id !== parseInt(seasonId)) {
            return res.status(400).json({
                error: "This competitor does not belong to the given season",
            });
        }
        res.json({
            competitor: {
                id: competitor.id,
                name: competitor.name,
                season: competitor.season,
                statistics: competitor.statistics,
                competitorStatsAdvices: competitor.competitorStatsAdvices,
                players: competitor.players.map((player) => ({
                    id: player.id,
                    name: player.name,
                    statistics: player.statistics,
                })),
            },
        });
    }
    catch (error) {
        console.error("Error fetching competitor statistics for season:", error);
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
});
// GET Player Statistics
app.get("/player-statistics", async (req, res) => {
    try {
        const { id, type, player_id, player_special_id, competitor_id, competitor_special_id, season_id, season_special_id, include_player, include_competitor, include_season, limit, offset, } = req.query;
        // Build the where clause dynamically
        const where = {};
        if (id)
            where.id = parseInt(id);
        if (type)
            where.type = { contains: type, mode: "insensitive" };
        if (player_id)
            where.playerId = parseInt(player_id);
        if (player_special_id) {
            where.player = {
                special_id: player_special_id,
            };
        }
        if (competitor_id ||
            competitor_special_id ||
            season_id ||
            season_special_id) {
            where.player = {
                ...where.player,
                competitor: {
                    ...(competitor_id && { id: parseInt(competitor_id) }),
                    ...(competitor_special_id && {
                        special_id: competitor_special_id,
                    }),
                    ...(season_id && { seasonId: parseInt(season_id) }),
                    ...(season_special_id && {
                        season: { special_id: season_special_id },
                    }),
                },
            };
        }
        // Build the include clause dynamically
        const include = {};
        if (include_player === "true") {
            include.player = {
                include: {
                    ...(include_competitor === "true" && {
                        competitor: {
                            include: {
                                ...(include_season === "true" && { season: true }),
                            },
                        },
                    }),
                },
            };
        }
        // Build pagination
        const pagination = {};
        if (limit)
            pagination.take = parseInt(limit);
        if (offset)
            pagination.skip = parseInt(offset);
        const statistics = await prisma.playerStatistique.findMany({
            where,
            include,
            ...pagination,
            orderBy: { id: "desc" },
        });
        res.json({
            data: statistics,
            count: statistics.length,
            filters: {
                id,
                type,
                player_id,
                player_special_id,
                competitor_id,
                competitor_special_id,
                season_id,
                season_special_id,
            },
            includes: { include_player, include_competitor, include_season },
        });
    }
    catch (error) {
        console.error("Error fetching player statistics:", error);
        res.status(500).json({ error: "Failed to fetch player statistics" });
    }
});
// Récupérer les statistiques d'un joueur par son special_id
app.get("/players/:special_id/statistics", async (req, res) => {
    const { special_id } = req.params;
    const player = await prisma.player.findUnique({
        where: { special_id },
        include: { statistics: true },
    });
    if (!player)
        return res.status(404).json({ error: "Joueur non trouvé" });
    res.json(player.statistics);
});
// GET Upcoming Matches for a Season
app.get("/seasons/:seasonId/upcoming-matches", async (req, res) => {
    const { seasonId } = req.params;
    try {
        const season = await prisma.season.findUnique({
            where: { special_id: seasonId },
            include: {
                upcomingMatches: {
                    include: {
                        home_competitor: true,
                        away_competitor: true,
                    },
                    orderBy: {
                        start_time: "asc",
                    },
                },
            },
        });
        if (!season) {
            return res.status(404).json({ error: "Season not found" });
        }
        const now = new Date();
        const upcomingMatches = season.upcomingMatches.filter((match) => new Date(match.start_time) > now);
        res.json({
            season: {
                id: season.id,
                special_id: season.special_id,
                name: season.name,
            },
            upcomingMatchesCount: upcomingMatches.length,
            upcomingMatches: upcomingMatches.map((match) => ({
                id: match.id,
                special_id: match.special_id,
                home_team: match.home_competitor.name,
                away_team: match.away_competitor.name,
                start_time: match.start_time,
                venue: match.venue,
                status: match.status,
            })),
        });
    }
    catch (error) {
        console.error("Error fetching upcoming matches:", error);
        res.status(500).json({ error: "Failed to fetch upcoming matches" });
    }
});
// POST Upcoming Matches - Fetch and store from SportRadar API
app.post("/seasons/:seasonId/upcoming-matches", async (req, res) => {
    const { seasonId } = req.params;
    try {
        // Vérifie que la saison existe
        const season = await prisma.season.findUnique({
            where: { special_id: seasonId },
            include: { competitors: true },
        });
        if (!season) {
            return res.status(404).json({ error: "Season not found" });
        }
        console.log(`Fetching matches for season ${seasonId}`);
        // Appel à l'API SportRadar pour récupérer le calendrier de la saison
        const matchesResponse = await fetch(`https://api.sportradar.com/soccer-extended/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/schedules.json`, {
            method: "GET",
            headers: {
                accept: "application/json",
                "x-api-key": process.env.SPORTRADAR_API_KEY || "",
            },
        });
        if (!matchesResponse.ok) {
            throw new Error(`SportRadar API error: ${matchesResponse.status}`);
        }
        const scheduleData = await matchesResponse.json();
        console.log(`Fetched ${scheduleData.schedules?.length || 0} scheduled events for season ${seasonId}`);
        const savedMatches = [];
        const now = new Date();
        if (scheduleData.schedules && scheduleData.schedules.length > 0) {
            for (const schedule of scheduleData.schedules) {
                try {
                    const sportEvent = schedule.sport_event;
                    const matchStartTime = new Date(sportEvent.start_time);
                    // Ne traiter que les matchs futurs
                    if (matchStartTime <= now)
                        continue;
                    const matchId = sportEvent.id.replace("sr:sport_event:", "");
                    // Vérifier qu'on a bien deux équipes
                    if (!sportEvent.competitors || sportEvent.competitors.length < 2) {
                        console.warn(`Not enough competitors for match ${matchId}, skipping`);
                        continue;
                    }
                    // Extraire les IDs des équipes
                    const homeCompetitorId = sportEvent.competitors[0]?.id.replace("sr:competitor:", "");
                    const awayCompetitorId = sportEvent.competitors[1]?.id.replace("sr:competitor:", "");
                    // Trouve les competitors locaux
                    const homeCompetitor = await prisma.competitor.findUnique({
                        where: { special_id: homeCompetitorId },
                    });
                    const awayCompetitor = await prisma.competitor.findUnique({
                        where: { special_id: awayCompetitorId },
                    });
                    if (!homeCompetitor || !awayCompetitor) {
                        console.warn(`Competitors not found for match ${matchId} (home: ${homeCompetitorId}, away: ${awayCompetitorId}), skipping`);
                        continue;
                    }
                    // Upsert du match
                    const savedMatch = await prisma.upcomingMatch.upsert({
                        where: { special_id: matchId },
                        update: {
                            start_time: matchStartTime,
                            venue: sportEvent.venue?.name || null,
                            status: schedule.sport_event_status?.status || "scheduled",
                        },
                        create: {
                            special_id: matchId,
                            homeCompetitorId: homeCompetitor.id,
                            awayCompetitorId: awayCompetitor.id,
                            seasonId: season.id,
                            start_time: matchStartTime,
                            venue: sportEvent.venue?.name || null,
                            status: schedule.sport_event_status?.status || "scheduled",
                        },
                        include: {
                            home_competitor: true,
                            away_competitor: true,
                        },
                    });
                    savedMatches.push(savedMatch);
                    console.log(`Saved upcoming match: ${savedMatch.home_competitor.name} vs ${savedMatch.away_competitor.name} on ${matchStartTime.toISOString()}`);
                }
                catch (matchError) {
                    console.warn(`Error processing match ${schedule.sport_event?.id}:`, matchError);
                    continue;
                }
            }
        }
        res.json({
            season: {
                id: season.id,
                special_id: season.special_id,
                name: season.name,
            },
            message: `Successfully imported ${savedMatches.length} upcoming matches`,
            totalScheduledEvents: scheduleData.schedules?.length || 0,
            upcomingMatches: savedMatches.map((match) => ({
                id: match.id,
                special_id: match.special_id,
                home_team: match.home_competitor.name,
                away_team: match.away_competitor.name,
                start_time: match.start_time,
                venue: match.venue,
                status: match.status,
            })),
        });
    }
    catch (error) {
        console.error("Error importing upcoming matches:", error);
        res.status(500).json({
            error: "Failed to import upcoming matches from SportRadar API",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.default = app;
