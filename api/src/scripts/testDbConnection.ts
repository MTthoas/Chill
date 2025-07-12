import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
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

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Tester la connexion en exécutant une requête simple
    console.log('Tentative de connexion à la base de données...');
    
    // Vérifier si la table Competitor existe et combien d'enregistrements elle contient
    const count = await prisma.$queryRaw<{count: number}[]>`SELECT COUNT(*) FROM "Competitor"`;
    console.log('Connexion réussie!');
    console.log('Nombre d\'équipes dans la base de données:', count[0].count);
    
    // Vérifier combien d'équipes n'ont pas de logo
    const noLogoCount = await prisma.$queryRaw<{count: number}[]>`SELECT COUNT(*) FROM "Competitor" WHERE logo IS NULL`;
    console.log('Nombre d\'équipes sans logo:', noLogoCount[0].count);
    
  } catch (error) {
    console.error('Erreur lors de la connexion à la base de données:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
