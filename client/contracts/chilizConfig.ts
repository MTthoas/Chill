// Configuration des adresses de contrats pour différentes chaînes
export const CHILIZ_CONTRACTS = {
  // Chiliz Mainnet (Chain ID: 88888)
  88888: {
    CHZ_TOKEN: "0x677F7e16C7Dd57be1D4C8aD1244883214953DC47", // Adresse du token CHZ sur Chiliz
    FAN_TOKEN_TRADING: "", // À remplir avec l'adresse déployée
    SUPPORTED_FAN_TOKENS: {
      // Exemples de fan tokens - à remplir avec les vraies adresses
      PSG: "",
      BAR: "",
      JUV: "",
      ACM: "",
    },
  },

  // Chiliz Testnet (Chain ID: 88882)
  88882: {
    CHZ_TOKEN: "0xD379473BAaEa19877138536c6532AC587A99f292", // CHZ testnet (deployed)
    FAN_TOKEN_TRADING: "0x3A7Ffcdd399FDF2494355aAf3b5Bd6b6B48b09c7", // Trading Contract (deployed)
    SUPPORTED_FAN_TOKENS: {
      PSG: "0x8F2888d10276F2A4Fe8F4b3D3F88B96B7A58F631",
      RMA: "0x7d502ff1BcD60c65BA6B24d95459991e9263e649",
      BAR: "0x6969a1a85537d6582B78473f3519D7e88887f91e",
      CITY: "0xF686528078f55EaDF2d0e0DD57560e055D1907EF",
      JUV: "0x473bD13c150852f52b62c9a4D2bA0F72B99D9986",
      BAY: "0x3A09F2193797864608E141F877dDcdCd1a44484f",
    },
  },

  // Localhost/Hardhat pour tests
  31337: {
    CHZ_TOKEN: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // CHZ Token (deployed)
    FAN_TOKEN_TRADING: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Trading Contract (deployed)
    SUPPORTED_FAN_TOKENS: {
      PSG: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      RMA: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
      BAR: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
      CITY: "0x9A676e781A523b5d0C0e43731313A708CB607508",
      JUV: "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
      BAY: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
    },
  },
};

// Métadonnées des équipes pour l'affichage
export const TEAM_METADATA = {
  PSG: {
    name: "Paris Saint-Germain",
    league: "Ligue 1",
    country: "France",
    logo: "https://assets.socios.com/club-logos/psg-logo.png",
    colors: {
      primary: "#004170",
      secondary: "#ED174C",
    },
  },
  RMA: {
    name: "Real Madrid",
    league: "La Liga",
    country: "Spain",
    logo: "https://assets.socios.com/club-logos/real-madrid-logo.png",
    colors: {
      primary: "#FFFFFF",
      secondary: "#FEBE10",
    },
  },
  BAR: {
    name: "FC Barcelona",
    league: "La Liga",
    country: "Spain",
    logo: "https://assets.socios.com/club-logos/bar-logo.png",
    colors: {
      primary: "#A50044",
      secondary: "#004D98",
    },
  },
  CITY: {
    name: "Manchester City",
    league: "Premier League",
    country: "England",
    logo: "https://assets.socios.com/club-logos/man-city-logo.png",
    colors: {
      primary: "#6CABDD",
      secondary: "#1C2C5B",
    },
  },
  JUV: {
    name: "Juventus",
    league: "Serie A",
    country: "Italy",
    logo: "https://assets.socios.com/club-logos/juv-logo.png",
    colors: {
      primary: "#000000",
      secondary: "#FFFFFF",
    },
  },
  BAY: {
    name: "Bayern Munich",
    league: "Bundesliga",
    country: "Germany",
    logo: "https://assets.socios.com/club-logos/bayern-logo.png",
    colors: {
      primary: "#DC052D",
      secondary: "#0066B2",
    },
  },
};

export function getContractAddresses(chainId: number) {
  return (
    CHILIZ_CONTRACTS[chainId as keyof typeof CHILIZ_CONTRACTS] ||
    CHILIZ_CONTRACTS[88882]
  );
}

export function getTeamMetadata(symbol: string) {
  return TEAM_METADATA[symbol as keyof typeof TEAM_METADATA];
}

export function isChilizChain(chainId: number): boolean {
  return chainId === 88888 || chainId === 88882;
}
