"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const url_1 = require("url");
// Obtenir le chemin du répertoire courant avec les modules ES
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path.dirname(__filename);
// Charger les variables d'environnement du fichier .env
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    console.log('Chargement des variables d\'environnement depuis', envPath);
    dotenv.config({ path: envPath });
}
else {
    console.log('Fichier .env non trouvé. Assurez-vous que DATABASE_URL est définie.');
}
// Vérifier que DATABASE_URL est définie
if (!process.env.DATABASE_URL) {
    console.error('La variable d\'environnement DATABASE_URL n\'est pas définie.');
    console.error('Veuillez la définir dans un fichier .env ou directement dans votre environnement.');
    process.exit(1);
}
console.log('Tentative de connexion à la base de données avec l\'URL:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@')); // Masquer le mot de passe dans les logs
async function testConnection() {
    const prisma = new client_1.PrismaClient();
    try {
        // Tester la connexion en exécutant une requête simple
        console.log('Tentative de connexion à la base de données...');
        // Vérifier si la table Competitor existe et combien d'enregistrements elle contient
        const count = await prisma.$queryRaw `SELECT COUNT(*) FROM "Competitor"`;
        console.log('Connexion réussie!');
        console.log('Nombre d\'équipes dans la base de données:', count[0].count);
        // Vérifier combien d'équipes n'ont pas de logo
        const noLogoCount = await prisma.$queryRaw `SELECT COUNT(*) FROM "Competitor" WHERE logo IS NULL`;
        console.log('Nombre d\'équipes sans logo:', noLogoCount[0].count);
    }
    catch (error) {
        console.error('Erreur lors de la connexion à la base de données:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testConnection();
