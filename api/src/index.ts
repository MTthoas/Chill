import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// CRUD Season
app.get("/seasons", async (req, res) => {
  const seasons = await prisma.season.findMany({
    include: { competitors: true },
  });
  res.json(seasons);
});

app.post("/seasons", async (req, res) => {
  const { name, special_id } = req.body;
  const season = await prisma.season.create({ data: { name, special_id } });
  res.json(season);
});

// CRUD Competitor
app.get("/competitors", async (req, res) => {
  const competitors = await prisma.competitor.findMany({
    include: { players: true, statistics: true, season: true },
  });
  res.json(competitors);
});

app.post("/competitors", async (req, res) => {
  const { name, seasonId } = req.body;
  const competitor = await prisma.competitor.create({
    data: { name, seasonId },
  });
  res.json(competitor);
});

// CRUD Player
app.post("/players", async (req, res) => {
  const { name, competitorId } = req.body;
  const player = await prisma.player.create({ data: { name, competitorId } });
  res.json(player);
});

// CRUD Statistique
app.post("/statistics", async (req, res) => {
  const { type, value, competitorId } = req.body;
  const stat = await prisma.statistique.create({
    data: { type, value, competitorId },
  });
  res.json(stat);
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
