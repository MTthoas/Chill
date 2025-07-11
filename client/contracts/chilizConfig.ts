// Configuration des adresses de contrats pour différentes chaînes
export const CHILIZ_CONTRACTS = {
  // Chiliz Mainnet (Chain ID: 88888)
  88888: {
    CHZ_TOKEN: "0x677F7e16C7Dd57be1D4C8aD1244883214953DC47", // Adresse du token CHZ sur Chiliz
    FAN_TOKEN_TRADING: "", // À remplir avec l'adresse déployée
    SUPPORTED_FAN_TOKENS: {
      // Exemples de fan tokens - à remplir avec les vraies adresses
      "PSG": "", 
      "BAR": "",
      "JUV": "",
      "ACM": "",
    }
  },
  
  // Chiliz Testnet (Chain ID: 88882)
  88882: {
    CHZ_TOKEN: "0x721ef6871f1c4efe730dce047d40d1743b886946", // CHZ testnet
    FAN_TOKEN_TRADING: "", // À remplir avec l'adresse déployée
    SUPPORTED_FAN_TOKENS: {
      // Tokens de test
      "TEST_PSG": "",
      "TEST_BAR": "",
    }
  },

  // Localhost/Hardhat pour tests
  31337: {
    CHZ_TOKEN: "", // À configurer lors du déploiement local
    FAN_TOKEN_TRADING: "",
    SUPPORTED_FAN_TOKENS: {}
  }
};

// Métadonnées des équipes pour l'affichage
export const TEAM_METADATA = {
  "PSG": {
    name: "Paris Saint-Germain",
    league: "Ligue 1",
    country: "France",
    logo: "https://assets.socios.com/club-logos/psg-logo.png",
    colors: {
      primary: "#004170",
      secondary: "#ED174C"
    }
  },
  "RMA": {
    name: "Real Madrid",
    league: "La Liga",
    country: "Spain",
    logo: "https://assets.socios.com/club-logos/real-madrid-logo.png",
    colors: {
      primary: "#FFFFFF",
      secondary: "#FEBE10"
    }
  },
  "BAR": {
    name: "FC Barcelona",
    league: "La Liga",
    country: "Spain",
    logo: "https://assets.socios.com/club-logos/bar-logo.png",
    colors: {
      primary: "#A50044",
      secondary: "#004D98"
    }
  },
  "CITY": {
    name: "Manchester City",
    league: "Premier League",
    country: "England",
    logo: "https://assets.socios.com/club-logos/man-city-logo.png",
    colors: {
      primary: "#6CABDD",
      secondary: "#1C2C5B"
    }
  },
  "JUV": {
    name: "Juventus",
    league: "Serie A",
    country: "Italy",
    logo: "https://assets.socios.com/club-logos/juv-logo.png",
    colors: {
      primary: "#000000",
      secondary: "#FFFFFF"
    }
  },
  "BAY": {
    name: "Bayern Munich",
    league: "Bundesliga",
    country: "Germany",
    logo: "https://assets.socios.com/club-logos/bayern-logo.png",
    colors: {
      primary: "#DC052D",
      secondary: "#0066B2"
    }
  }
};

export function getContractAddresses(chainId: number) {
  return CHILIZ_CONTRACTS[chainId as keyof typeof CHILIZ_CONTRACTS] || CHILIZ_CONTRACTS[88882];
}

export function getTeamMetadata(symbol: string) {
  return TEAM_METADATA[symbol as keyof typeof TEAM_METADATA];
}

export function isChilizChain(chainId: number): boolean {
  return chainId === 88888 || chainId === 88882;
}
