import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fetchAndSaveStatisticsForAllCompetitors() {
  const seasons = await prisma.season.findMany({
    include: { competitors: true },
  });

  for (const season of seasons) {
    for (const competitor of season.competitors) {
      try {
        // Vérifie si on a déjà des stats pour ce competitor dans cette saison aujourd'hui
        const existingStats = await prisma.statistique.findFirst({
          where: {
            competitorId: competitor.id,
            updatedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // aujourd'hui
            },
          },
        });

        if (existingStats) {
          console.log(
            `Statistiques déjà présentes pour competitor ${competitor.special_id} saison ${season.special_id} aujourd'hui, on skip.`
          );
          continue;
        }

        // Appel à l'API SportRadar pour récupérer les stats de l'équipe
        const statisticsResponse = await fetch(
          `https://api.sportradar.com/soccer/trial/v4/en/seasons/sr%3Aseason%3A${season.special_id}/competitors/sr%3Acompetitor%3A${competitor.special_id}/statistics.json`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              "x-api-key": process.env.SPORTRADAR_API_KEY || "",
            },
          }
        );

        if (!statisticsResponse.ok) {
          console.error(
            `Erreur SportRadar pour competitor ${competitor.special_id} saison ${season.special_id}: ${statisticsResponse.status}`
          );
          continue;
        }

        const statisticsData = await statisticsResponse.json();

        // Sauvegarde des statistiques de l'équipe
        if (statisticsData.competitor?.statistics) {
          for (const [statType, statValue] of Object.entries(
            statisticsData.competitor.statistics
          )) {
            const existingStat = await prisma.statistique.findFirst({
              where: {
                competitorId: competitor.id,
                type: statType,
              },
            });

            if (existingStat) {
              await prisma.statistique.update({
                where: { id: existingStat.id },
                data: { value: Number(statValue) },
              });
            } else {
              await prisma.statistique.create({
                data: {
                  type: statType,
                  value: Number(statValue),
                  competitorId: competitor.id,
                },
              });
            }
          }
        }

        // Sauvegarde des statistiques des joueurs de l'équipe
        if (statisticsData.competitor?.players) {
          for (const playerData of statisticsData.competitor.players) {
            const playerId = playerData.id.replace("sr:player:", "");
            const localPlayer = await prisma.player.findUnique({
              where: { special_id: playerId },
            });
            if (!localPlayer) continue;

            if (playerData.statistics) {
              for (const [statType, statValue] of Object.entries(
                playerData.statistics
              )) {
                const existingStat = await prisma.playerStatistique.findFirst({
                  where: {
                    playerId: localPlayer.id,
                    type: statType,
                  },
                });

                if (existingStat) {
                  await prisma.playerStatistique.update({
                    where: { id: existingStat.id },
                    data: { value: Number(statValue) },
                  });
                } else {
                  await prisma.playerStatistique.create({
                    data: {
                      type: statType,
                      value: Number(statValue),
                      playerId: localPlayer.id,
                    },
                  });
                }
              }
            }
          }
        }

        // Petite pause pour éviter le rate limit
        await new Promise((resolve) => setTimeout(resolve, 1200));
        console.log(
          `Statistiques mises à jour pour competitor ${competitor.special_id} saison ${season.special_id}`
        );
      } catch (error) {
        console.error(
          `Erreur lors de la récupération des stats pour competitor ${competitor.special_id} saison ${season.special_id}:`,
          error
        );
      }
    }
  }

  // Après avoir mis à jour les stats, générer les avis IA
  await generateCompetitorAdvices();

  await prisma.$disconnect();
}

async function generateCompetitorAdvices() {
  console.log("Génération des avis IA pour les équipes...");

  const seasons = await prisma.season.findMany({
    include: {
      competitors: {
        include: {
          statistics: true,
        },
      },
    },
  });

  for (const season of seasons) {
    for (const competitor of season.competitors) {
      try {
        // Vérifie si on a déjà un avis pour aujourd'hui
        const existingAdvice = await prisma.competitorStatsAdvice.findFirst({
          where: {
            competitorId: competitor.id,
            created_at: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });

        if (existingAdvice) {
          console.log(`Avis déjà généré pour ${competitor.name} aujourd'hui`);
          continue;
        }

        // Récupérer le prochain match stocké en base
        let nextMatchInfo = "";
        let nextMatch = await prisma.upcomingMatch.findFirst({
          where: {
            seasonId: season.id,
            OR: [
              { homeCompetitorId: competitor.id },
              { awayCompetitorId: competitor.id },
            ],
            start_time: { gt: new Date() },
          },
          orderBy: { start_time: "asc" },
          include: {
            home_competitor: true,
            away_competitor: true,
          },
        });

        if (nextMatch) {
          const isHome = nextMatch.homeCompetitorId === competitor.id;
          const opponent = isHome
            ? nextMatch.away_competitor
            : nextMatch.home_competitor;
          nextMatchInfo = `Prochain match: vs ${
            opponent?.name || "inconnu"
          } le ${new Date(nextMatch.start_time).toLocaleDateString()}`;
        }

        // Préparer les données statistiques pour ChatGPT
        const statsText = competitor.statistics
          .map((stat) => `${stat.type}: ${stat.value}`)
          .join(", ");

        if (!statsText) {
          console.log(
            `Pas de statistiques pour ${competitor.name}, skip avis IA`
          );
          continue;
        }

        // Appel à l'API ChatGPT avec prompt adapté selon la disponibilité du prochain match
        let prompt;
        if (nextMatchInfo && nextMatch) {
          // Ajout d'un prompt expertisé et d'un ordre obligatoire
          const isHome = nextMatch.homeCompetitorId === competitor.id;
          const opponent = isHome
            ? nextMatch.away_competitor
            : nextMatch.home_competitor;
          prompt = `Tu es un expert et pronostiqueur sportif professionnel. Fais une analyse détaillée et argumentée (max 80 mots) des statistiques de ${
            competitor.name
          } en ${
            season.name
          }, en te concentrant sur les points forts/faibles, la dynamique récente, et les enjeux du prochain match contre ${
            opponent?.name || "inconnu"
          } le ${new Date(
            nextMatch.start_time
          ).toLocaleDateString()}. Compare les deux équipes, anticipe les clés du match, et donne une prédiction réaliste. Termine toujours par un ordre d'investissement OBLIGATOIRE pour ce club : "buy" (acheter) ou "sell" (vendre), selon la dynamique et le contexte.\nFormat strict : "Perf : [analyse poussée]. Prochain : [prédiction]. Order : [buy/sell]". L'ordre doit toujours être présent, sans exception.`;
        } else {
          prompt = `Tu es un expert et pronostiqueur sportif professionnel. Fais une analyse détaillée et argumentée (max 80 mots) des statistiques de ${competitor.name} en ${season.name}, en te concentrant sur les points forts/faibles, la dynamique récente, et le bilan global de la saison. Termine toujours par un ordre d'investissement OBLIGATOIRE pour ce club : "buy" (acheter) ou "sell" (vendre), selon la dynamique et le contexte.\nFormat strict : "Bilan : [analyse poussée]. Order : [buy/sell]". L'ordre doit toujours être présent, sans exception.`;
        }

        const chatGptResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              max_tokens: 80,
              temperature: 0.7,
            }),
          }
        );

        if (!chatGptResponse.ok) {
          console.error(
            `Erreur ChatGPT pour ${competitor.name}: ${chatGptResponse.status}`
          );
          continue;
        }

        const chatGptData = await chatGptResponse.json();
        const rawContent =
          chatGptData.choices[0]?.message?.content?.trim() ||
          "Analyse non disponible";
        // Extraction de l'ordre (buy/sell) depuis la réponse
        let order = "";
        const orderMatch = rawContent.match(/order\s*:\s*(buy|sell)/i);
        if (orderMatch) {
          order = orderMatch[1].toLowerCase();
        } else {
          // fallback naïf : si pas trouvé, on tente de deviner
          if (/buy/i.test(rawContent)) order = "buy";
          else if (/sell/i.test(rawContent)) order = "sell";
          else order = "";
        }
        // Nettoyage de l'avis (on retire la mention Order si présente)
        const advice = rawContent.replace(/Order\s*:\s*(buy|sell)/i, "").trim();

        // Sauvegarder l'avis en base
        await prisma.competitorStatsAdvice.create({
          data: {
            competitorId: competitor.id,
            advice: advice,
            order: order,
          },
        });

        console.log(`Avis généré pour ${competitor.name}: ${advice}`);

        // Pause pour éviter le rate limit OpenAI
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `Erreur lors de la génération d'avis pour ${competitor.name}:`,
          error
        );
      }
    }
  }
}

fetchAndSaveStatisticsForAllCompetitors().then(() => {
  console.log("Tâche cron terminée.");
  process.exit(0);
});
