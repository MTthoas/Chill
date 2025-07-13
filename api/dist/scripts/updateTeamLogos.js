"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const node_fetch_1 = __importDefault(require("node-fetch"));
const prisma = new client_1.PrismaClient();
const TOKEN = "6GXEMGUW4ijMXggC9gpRUf82RTeFa2rQ4efn2hpqyDwIgKMEyOoMBT7k";
/**
 * Normalise le nom d'une équipe pour maximiser les chances de match avec l'API SportMonks
 */
function normalizeTeamNames(name) {
    const variants = [name];
    // Retirer les préfixes/suffixes courants
    let n = name;
    n = n.replace(/^(FC|SC|AC|AS|US|CA|CF|CD|CSD|Real|Club)\s+/i, "");
    n = n.replace(/\s+(FC|SC|AC|AS|US|CA|CF|CD|CSD|Real|Club)$/i, "");
    n = n.replace(/\s+(Turin|Milano|Munich|Salzburg|Dortmund)$/i, "");
    n = n.replace(/\s+de\s+/i, " ");
    n = n.replace(/\s+\(.+\)$/i, "");
    variants.push(n.trim());
    // Variantes connues
    if (/juventus/i.test(name))
        variants.push("Juventus");
    if (/inter/i.test(name))
        variants.push("Inter Milan");
    if (/bayern/i.test(name))
        variants.push("Bayern");
    if (/dortmund/i.test(name))
        variants.push("Borussia Dortmund");
    if (/salzburg/i.test(name))
        variants.push("Salzburg");
    if (/paris/i.test(name))
        variants.push("Paris Saint-Germain");
    if (/chelsea/i.test(name))
        variants.push("Chelsea");
    if (/barcelona/i.test(name))
        variants.push("Barcelona");
    if (/madrid/i.test(name))
        variants.push("Real Madrid");
    // Retirer doublons et espaces
    return Array.from(new Set(variants.map((v) => v.trim())));
}
/**
 * Récupère le logo d'une équipe à partir de son nom via l'API SportMonks
 * Essaie plusieurs variantes de nom
 */
async function getTeamLogoByNameSmart(teamName) {
    const namesToTry = normalizeTeamNames(teamName);
    for (const name of namesToTry) {
        try {
            const url = `https://api.sportmonks.com/v3/football/teams/search/${encodeURIComponent(name)}?api_token=${TOKEN}`;
            const res = await (0, node_fetch_1.default)(url);
            const json = (await res.json());
            if (json.data && json.data.length > 0) {
                return {
                    name: json.data[0].name,
                    short_code: json.data[0].short_code,
                    logo: json.data[0].image_path,
                };
            }
        }
        catch (error) {
            console.error(`Erreur lors de la récupération du logo pour ${name}:`, error);
        }
    }
    return null;
}
/**
 * Récupère le logo d'une équipe à partir de son nom via l'API SportMonks
 * @param teamName Nom de l'équipe
 * @returns Informations sur l'équipe avec son logo si trouvé, null sinon
 */
async function getTeamLogoByName(teamName) {
    try {
        const url = `https://api.sportmonks.com/v3/football/teams/search/${encodeURIComponent(teamName)}?api_token=${TOKEN}`;
        const res = await (0, node_fetch_1.default)(url);
        const json = (await res.json());
        if (json.data && json.data.length > 0) {
            return {
                name: json.data[0].name,
                short_code: json.data[0].short_code,
                logo: json.data[0].image_path,
            };
        }
        return null;
    }
    catch (error) {
        console.error(`Erreur lors de la récupération du logo pour ${teamName}:`, error);
        return null;
    }
}
/**
 * Met à jour les logos des équipes dans la base de données
 */
async function updateTeamLogos() {
    try {
        // Récupérer toutes les équipes dont le logo est null
        const competitors = await prisma.competitor.findMany({
            where: {
                logo: null,
            },
        });
        console.log(`Mise à jour des logos pour ${competitors.length} équipes...`);
        let updatedCount = 0;
        for (const competitor of competitors) {
            console.log(`Recherche du logo pour ${competitor.name}...`);
            let teamInfo = await getTeamLogoByNameSmart(competitor.short_name);
            if (!teamInfo && competitor.short_name) {
                console.log(`Tentative avec le short_name pour ${competitor.short_name}...`);
                teamInfo = await getTeamLogoByNameSmart(competitor.short_name);
            }
            if (teamInfo && teamInfo.logo) {
                await prisma.competitor.update({
                    where: { id: competitor.id },
                    data: { logo: teamInfo.logo },
                });
                updatedCount++;
                console.log(`Logo mis à jour pour ${competitor.name}: ${teamInfo.logo}`);
            }
            else {
                console.log(`Aucun logo trouvé pour ${competitor.name} / ${competitor.short_name}`);
            }
            // Petite pause pour éviter de saturer l'API
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
        console.log(`Mise à jour terminée. ${updatedCount}/${competitors.length} logos mis à jour.`);
    }
    catch (error) {
        console.error("Erreur lors de la mise à jour des logos:", error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Exécuter le script
updateTeamLogos()
    .then(() => {
    console.log("Script terminé.");
})
    .catch((error) => {
    console.error("Erreur dans le script:", error);
})
    .finally(() => {
    process.exit(0);
});
