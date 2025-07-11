import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Helper function to fetch season info from SportRadar API
async function fetchSeasonInfo(seasonId: string) {
  const response = await fetch(
    `https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/info.json`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.SPORTRADAR_API_KEY || "",
      },
    }
  );

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
  } catch (error) {
    console.error("Error fetching season info:", error);
    if (error instanceof Error && error.message.includes("Season not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res
        .status(500)
        .json({ error: "Failed to fetch season info from SportRadar API" });
    }
  }
});

// CRUD Season
app.get("/seasons", async (req, res) => {
  try {
    const {
      id,
      special_id,
      name,
      year,
      competition_id,
      include_competitors,
      include_players,
      include_statistics,
      limit,
      offset,
    } = req.query;

    // Build the where clause dynamically
    const where: any = {};
    if (id) where.id = parseInt(id as string);
    if (special_id) where.special_id = special_id as string;
    if (name) where.name = { contains: name as string, mode: "insensitive" };
    if (year) where.year = year as string;
    if (competition_id) where.competition_id = competition_id as string;

    // Build the include clause dynamically
    const include: any = {};
    if (include_competitors === "true") {
      include.competitors = {
        include: {
          ...(include_players === "true" && { players: true }),
          ...(include_statistics === "true" && { statistics: true }),
        },
      };
    }

    // Build pagination
    const pagination: any = {};
    if (limit) pagination.take = parseInt(limit as string);
    if (offset) pagination.skip = parseInt(offset as string);

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
  } catch (error) {
    console.error("Error fetching seasons:", error);
    res.status(500).json({ error: "Failed to fetch seasons" });
  }
});

app.post("/seasons", async (req, res) => {
  try {
    // Fetch seasons from SportRadar API
    const response = await fetch(
      "https://api.sportradar.com/soccer/trial/v4/en/seasons.json",
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": process.env.SPORTRADAR_API_KEY || "",
        },
      }
    );

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
      const competitionId = seasonData.competition_id.replace(
        "sr:competition:",
        ""
      );

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
  } catch (error) {
    console.error("Error fetching seasons:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch seasons from SportRadar API" });
  }
});

// CRUD Competitor
app.get("/competitors", async (req, res) => {
<<<<<<< HEAD
  try {
    const {
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
      include_players,
      include_statistics,
      include_season,
      limit,
      offset,
    } = req.query;

    // Build the where clause dynamically
    const where: any = {};
    if (id) where.id = parseInt(id as string);
    if (special_id) where.special_id = special_id as string;
    if (name) where.name = { contains: name as string, mode: "insensitive" };
    if (short_name)
      where.short_name = {
        contains: short_name as string,
        mode: "insensitive",
      };
    if (abbreviation) where.abbreviation = abbreviation as string;
    if (gender) where.gender = gender as string;
    if (country)
      where.country = { contains: country as string, mode: "insensitive" };
    if (country_code) where.country_code = country_code as string;
    if (season_id) where.seasonId = parseInt(season_id as string);
    if (season_special_id) {
      where.season = {
        special_id: season_special_id as string,
      };
    }

    // Build the include clause dynamically
    const include: any = {};
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
    const pagination: any = {};
    if (limit) pagination.take = parseInt(limit as string);
    if (offset) pagination.skip = parseInt(offset as string);

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
  } catch (error) {
    console.error("Error fetching competitors:", error);
    res.status(500).json({ error: "Failed to fetch competitors" });
  }
=======
  const competitors = await prisma.competitor.findMany({
    include: { statistics: true, season: true },
  });
  res.json(competitors);
>>>>>>> 6a2c484 (PlayerStatsAIAdvice Schema & CompetitorStatsAdvice)
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
    const response = await fetch(
      `https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/competitors.json`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": process.env.SPORTRADAR_API_KEY || "",
        },
      }
    );

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
        error:
          "Season not found in local database. Please create the season first using POST /seasons",
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
  } catch (error) {
    console.error("Error fetching competitors:", error);
    if (error instanceof Error && error.message.includes("Season not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res
        .status(500)
        .json({ error: "Failed to fetch competitors from SportRadar API" });
    }
  }
});

// CRUD Player
app.get("/players", async (req, res) => {
  try {
    const {
      id,
      special_id,
      name,
      competitor_id,
      competitor_special_id,
      season_id,
      season_special_id,
      include_competitor,
      include_statistics,
      include_season,
      limit,
      offset,
    } = req.query;

    // Build the where clause dynamically
    const where: any = {};
    if (id) where.id = parseInt(id as string);
    if (special_id) where.special_id = special_id as string;
    if (name) where.name = { contains: name as string, mode: "insensitive" };
    if (competitor_id) where.competitorId = parseInt(competitor_id as string);
    if (competitor_special_id) {
      where.competitor = {
        special_id: competitor_special_id as string,
      };
    }
    if (season_id || season_special_id) {
      where.competitor = {
        ...where.competitor,
        ...(season_id && { seasonId: parseInt(season_id as string) }),
        ...(season_special_id && {
          season: { special_id: season_special_id as string },
        }),
      };
    }

    // Build the include clause dynamically
    const include: any = {};
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
    const pagination: any = {};
    if (limit) pagination.take = parseInt(limit as string);
    if (offset) pagination.skip = parseInt(offset as string);

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
  } catch (error) {
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
    const playersResponse = await fetch(
      `https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/competitor_players.json`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": process.env.SPORTRADAR_API_KEY || "",
        },
      }
    );

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
        error:
          "Season not found in local database. Please create the season first using POST /seasons",
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
        console.warn(
          `Competitor with special_id ${competitorId} not found. Skipping players for ${competitorData.name}`
        );
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
  } catch (error) {
    console.error("Error fetching players:", error);
    if (error instanceof Error && error.message.includes("Season not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res
        .status(500)
        .json({ error: "Failed to fetch players from SportRadar API" });
    }
  }
});

// CRUD Player Statistics
app.post("/player-statistics", async (req, res) => {
  const { seasonId, competitorId } = req.body;

  console.log(
    "Fetching player statistics for season ID:",
    seasonId,
    "and competitor ID:",
    competitorId
  );

  try {
    // First, verify that the season exists using helper function
    const seasonInfo = await fetchSeasonInfo(seasonId);

    console.log("Season info validated:", seasonInfo.season);

    // Wait 1 second to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Fetch player statistics from SportRadar API
    const statisticsResponse = await fetch(
      `https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${seasonId}/competitors/sr%3Acompetitor%3A${competitorId}/statistics.json`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": process.env.SPORTRADAR_API_KEY || "",
        },
      }
    );

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
        error:
          "Season not found in local database. Please create the season first using POST /seasons",
      });
    }

    const localCompetitor = await prisma.competitor.findUnique({
      where: { special_id: String(competitorId) },
    });

    if (!localCompetitor) {
      return res.status(404).json({
        error:
          "Competitor not found in local database. Please create the competitor first using POST /competitors",
      });
    }

    // Create/update competitor statistics
    const competitorStats = [];
    if (statisticsData.competitor.statistics) {
      for (const [statType, statValue] of Object.entries(
        statisticsData.competitor.statistics
      )) {
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
        } else {
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
          console.warn(
            `Player with special_id ${playerId} not found. Skipping statistics for ${playerData.name}`
          );
          continue;
        }

        // Create player statistics
        if (playerData.statistics) {
          for (const [statType, statValue] of Object.entries(
            playerData.statistics
          )) {
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
            } else {
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
  } catch (error) {
    console.error("Error fetching player statistics:", error);
    if (error instanceof Error && error.message.includes("Season not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({
        error: "Failed to fetch player statistics from SportRadar API",
      });
    }
  }
});

// GET Competitor Statistics
app.get("/competitor-statistics", async (req, res) => {
  try {
    const {
      id,
      type,
      competitor_id,
      competitor_special_id,
      season_id,
      season_special_id,
      include_competitor,
      include_season,
      limit,
      offset,
    } = req.query;

    // Build the where clause dynamically
    const where: any = {};
    if (id) where.id = parseInt(id as string);
    if (type) where.type = { contains: type as string, mode: "insensitive" };
    if (competitor_id) where.competitorId = parseInt(competitor_id as string);
    if (competitor_special_id) {
      where.competitor = {
        special_id: competitor_special_id as string,
      };
    }
    if (season_id || season_special_id) {
      where.competitor = {
        ...where.competitor,
        ...(season_id && { seasonId: parseInt(season_id as string) }),
        ...(season_special_id && {
          season: { special_id: season_special_id as string },
        }),
      };
    }

    // Build the include clause dynamically
    const include: any = {};
    if (include_competitor === "true") {
      include.competitor = {
        include: {
          ...(include_season === "true" && { season: true }),
        },
      };
    }

    // Build pagination
    const pagination: any = {};
    if (limit) pagination.take = parseInt(limit as string);
    if (offset) pagination.skip = parseInt(offset as string);

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
  } catch (error) {
    console.error("Error fetching competitor statistics:", error);
    res.status(500).json({ error: "Failed to fetch competitor statistics" });
  }
});

// GET Player Statistics
app.get("/player-statistics", async (req, res) => {
  try {
    const {
      id,
      type,
      player_id,
      player_special_id,
      competitor_id,
      competitor_special_id,
      season_id,
      season_special_id,
      include_player,
      include_competitor,
      include_season,
      limit,
      offset,
    } = req.query;

    // Build the where clause dynamically
    const where: any = {};
    if (id) where.id = parseInt(id as string);
    if (type) where.type = { contains: type as string, mode: "insensitive" };
    if (player_id) where.playerId = parseInt(player_id as string);
    if (player_special_id) {
      where.player = {
        special_id: player_special_id as string,
      };
    }
    if (
      competitor_id ||
      competitor_special_id ||
      season_id ||
      season_special_id
    ) {
      where.player = {
        ...where.player,
        competitor: {
          ...(competitor_id && { id: parseInt(competitor_id as string) }),
          ...(competitor_special_id && {
            special_id: competitor_special_id as string,
          }),
          ...(season_id && { seasonId: parseInt(season_id as string) }),
          ...(season_special_id && {
            season: { special_id: season_special_id as string },
          }),
        },
      };
    }

    // Build the include clause dynamically
    const include: any = {};
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
    const pagination: any = {};
    if (limit) pagination.take = parseInt(limit as string);
    if (offset) pagination.skip = parseInt(offset as string);

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
  } catch (error) {
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
  if (!player) return res.status(404).json({ error: "Joueur non trouvé" });
  res.json(player.statistics);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API démarrée sur http://localhost:${port}`);
});
