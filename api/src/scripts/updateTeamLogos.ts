import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire courant avec les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement du fichier .env
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  console.log('Chargement des variables d\'environnement depuis', envPath);
  dotenv.config({ path: envPath });
} else {
  console.log('Fichier .env non trouvé. Assurez-vous que DATABASE_URL est définie.');
}

// Vérifier que DATABASE_URL est définie
if (!process.env.DATABASE_URL) {
  console.error('La variable d\'environnement DATABASE_URL n\'est pas définie.');
  console.error('Veuillez la définir dans un fichier .env ou directement dans votre environnement.');
  process.exit(1);
}

console.log('Tentative de connexion à la base de données avec l\'URL:', 
  process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@')); // Masquer le mot de passe dans les logs

const prisma = new PrismaClient();
const TOKEN = '6GXEMGUW4ijMXggC9gpRUf82RTeFa2rQ4efn2hpqyDwIgKMEyOoMBT7k';

/**
 * Interface pour la réponse de l'API SportMonks
 */
interface TeamResponse {
  data: Array<{
    name: string;
    short_code: string;
    image_path: string;
  }>;
}

/**
 * Récupère le logo d'une équipe à partir de son nom via l'API SportMonks
 * @param teamName Nom de l'équipe
 * @returns Informations sur l'équipe avec son logo si trouvé, null sinon
 */
async function getTeamLogoByName(teamName: string) {
  try {
    const url = `https://api.sportmonks.com/v3/football/teams/search/${encodeURIComponent(teamName)}?api_token=${TOKEN}`;
    const res = await fetch(url);
    const json = await res.json() as TeamResponse;

    if (json.data && json.data.length > 0) {
      return {
        name: json.data[0].name,
        short_code: json.data[0].short_code,
        logo: json.data[0].image_path
      };
    }
    return null;
  } catch (error) {
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
        logo: null
      }
    });

    console.log(`Mise à jour des logos pour ${competitors.length} équipes...`);

    let updatedCount = 0;
    for (const competitor of competitors) {
      console.log(`Recherche du logo pour ${competitor.name}...`);
      const teamInfo = await getTeamLogoByName(competitor.name);
      
      if (teamInfo && teamInfo.logo) {
        await prisma.competitor.update({
          where: { id: competitor.id },
          data: { logo: teamInfo.logo }
        });
        updatedCount++;
        console.log(`Logo mis à jour pour ${competitor.name}: ${teamInfo.logo}`);
      } else {
        // Essayer avec le short_name si le nom complet ne donne pas de résultats
        console.log(`Tentative avec le short_name pour ${competitor.short_name}...`);
        const teamInfoAlt = await getTeamLogoByName(competitor.short_name);
        
        if (teamInfoAlt && teamInfoAlt.logo) {
          await prisma.competitor.update({
            where: { id: competitor.id },
            data: { logo: teamInfoAlt.logo }
          });
          updatedCount++;
          console.log(`Logo mis à jour pour ${competitor.short_name}: ${teamInfoAlt.logo}`);
        } else {
          console.log(`Aucun logo trouvé pour ${competitor.name} / ${competitor.short_name}`);
        }
      }
      
      // Petite pause pour éviter de saturer l'API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Mise à jour terminée. ${updatedCount}/${competitors.length} logos mis à jour.`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des logos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
updateTeamLogos();
