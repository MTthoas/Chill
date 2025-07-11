import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const season = await prisma.season.upsert({
    where: { special_id: "126393" },
    update: {},
    create: {
      special_id: "126393",
      name: "FIFA Club World Cup 2025",
      start_date: new Date("2025-06-01"),
      end_date: new Date("2025-07-13"),
      year: "2025",
      competition_id: "sr:competition:357",
    },
  });

  const competitor = await prisma.competitor.upsert({
    where: { special_id: "1644" },
    update: {},
    create: {
      special_id: "1644",
      name: "Paris Saint-Germain",
      short_name: "PSG",
      abbreviation: "PSG",
      gender: "male",
      country: "France",
      country_code: "FRA",
      seasonId: season.id,
    },
  });

  // Statistiques du PSG
  const competitorStats = [
    { type: "average_ball_possession", value: 65.67 },
    { type: "cards_given", value: 7 },
    { type: "corner_kicks", value: 31 },
    { type: "free_kicks", value: 70 },
    { type: "goals_by_foot", value: 14 },
    { type: "goals_by_head", value: 1 },
    { type: "goals_conceded", value: 1 },
    { type: "goals_conceded_first_half", value: 1 },
    { type: "goals_conceded_second_half", value: 0 },
    { type: "goals_scored", value: 16 },
    { type: "goals_scored_first_half", value: 10 },
    { type: "goals_scored_second_half", value: 6 },
    { type: "matches_played", value: 6 },
    { type: "offsides", value: 10 },
    { type: "red_cards", value: 2 },
    { type: "shots_blocked", value: 15 },
    { type: "shots_off_target", value: 30 },
    { type: "shots_on_bar", value: 1 },
    { type: "shots_on_post", value: 2 },
    { type: "shots_on_target", value: 36 },
    { type: "shots_total", value: 81 },
    { type: "yellow_cards", value: 5 },
    { type: "yellow_red_cards", value: 0 },
  ];

  for (const stat of competitorStats) {
    await prisma.statistique.create({
      data: {
        type: stat.type,
        value: stat.value,
        competitorId: competitor.id,
      },
    });
  }

  // Joueurs du PSG
  const players = [
    { special_id: "155995", name: "Marquinhos" },
    { special_id: "352370", name: "Hernandez, Lucas" },
    { special_id: "361350", name: "Dembele, Ousmane" },
    { special_id: "756514", name: "Donnarumma, Gianluigi" },
    { special_id: "784655", name: "Ruiz, Fabian" },
    { special_id: "903858", name: "Hakimi, Achraf" },
    { special_id: "1055229", name: "Vitinha" },
    { special_id: "1061013", name: "Kvaratskhelia, Khvicha" },
    { special_id: "1414159", name: "Pacho, Willian" },
    { special_id: "1479784", name: "Ramos, Goncalo" },
    { special_id: "1493461", name: "Kang-in, Lee" },
    { special_id: "1834794", name: "Mendes, Nuno" },
    { special_id: "1948356", name: "Barcola, Bradley" },
    { special_id: "2157426", name: "Beraldo" },
    { special_id: "2240523", name: "Neves, Joao" },
    { special_id: "2256607", name: "Zaire-Emery, Warren" },
    { special_id: "2304851", name: "Doue, Desire" },
    { special_id: "2568589", name: "Mayulu, Senny" },
    { special_id: "2716386", name: "Mbaye, Ibrahim" },
    { special_id: "2952657", name: "Kamara, Noham" },
  ];

  for (const playerData of players) {
    await prisma.player.create({
      data: {
        special_id: playerData.special_id,
        name: playerData.name,
        competitorId: competitor.id,
      },
    });
  }

  // Statistiques des joueurs (exemple pour Marquinhos)
  const marquinhos = await prisma.player.findUnique({
    where: { special_id: "155995" },
  });

  if (marquinhos) {
    const marquinhosStats = [
      { type: "assists", value: 0 },
      { type: "cards_given", value: 1 },
      { type: "goals_by_head", value: 0 },
      { type: "goals_by_penalty", value: 0 },
      { type: "goals_conceded", value: 0 },
      { type: "goals_scored", value: 0 },
      { type: "matches_played", value: 5 },
      { type: "own_goals", value: 0 },
      { type: "penalties_missed", value: 0 },
      { type: "red_cards", value: 0 },
      { type: "substituted_in", value: 0 },
      { type: "substituted_out", value: 1 },
      { type: "yellow_cards", value: 1 },
      { type: "yellow_red_cards", value: 0 },
    ];

    for (const stat of marquinhosStats) {
      await prisma.playerStatistique.create({
        data: {
          type: stat.type,
          value: stat.value,
          playerId: marquinhos.id,
        },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
