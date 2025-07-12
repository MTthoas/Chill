import { Address } from "viem";

// Contract Addresses on Chiliz Spicy Testnet (Chain ID: 88882)
export const CONTRACT_ADDRESSES = {
  // Replace these with your actual deployed contract addresses
  CHILIZ_FAN_TOKEN_TRADING:
    "0x3A7Ffcdd399FDF2494355aAf3b5Bd6b6B48b09c7" as Address, // Your main trading contract
  CHZ_TOKEN: "0xD379473BAaEa19877138536c6532AC587A99f292" as Address, // CHZ token address on testnet

  // Fan Token Addresses - Add your deployed fan token addresses
  FAN_TOKENS: {
    PSG: "0x8F2888d10276F2A4Fe8F4b3D3F88B96B7A58F631" as Address,
    REAL_MADRID: "0x7d502ff1BcD60c65BA6B24d95459991e9263e649" as Address,
    BARCELONA: "0x6969a1a85537d6582B78473f3519D7e88887f91e" as Address,
    MANCHESTER_CITY: "0xF686528078f55EaDF2d0e0DD57560e055D1907EF" as Address,
    JUVENTUS: "0x473bD13c150852f52b62c9a4D2bA0F72B99D9986" as Address,
    BAYERN_MUNICH: "0x3A09F2193797864608E141F877dDcdCd1a44484f" as Address,
  },
} as const;

// Chain configuration
export const SUPPORTED_CHAINS = {
  CHILIZ_SPICY_TESTNET: 88882,
  CHILIZ_MAINNET: 88888,
} as const;

// Fan token metadata
export const FAN_TOKEN_METADATA = [
  {
    name: "PSG",
    symbol: "PSG",
    color: "#004170",
    emoji: "⚽",
    address: CONTRACT_ADDRESSES.FAN_TOKENS.PSG,
  },
  {
    name: "Real Madrid",
    symbol: "RMA",
    color: "#FEBE10",
    emoji: "👑",
    address: CONTRACT_ADDRESSES.FAN_TOKENS.REAL_MADRID,
  },
  {
    name: "Barcelona",
    symbol: "BAR",
    color: "#A50044",
    emoji: "🔵",
    address: CONTRACT_ADDRESSES.FAN_TOKENS.BARCELONA,
  },
  {
    name: "Manchester City",
    symbol: "CITY",
    color: "#6CABDD",
    emoji: "💙",
    address: CONTRACT_ADDRESSES.FAN_TOKENS.MANCHESTER_CITY,
  },
  {
    name: "Juventus",
    symbol: "JUV",
    color: "#000000",
    emoji: "⚪",
    address: CONTRACT_ADDRESSES.FAN_TOKENS.JUVENTUS,
  },
  {
    name: "Bayern Munich",
    symbol: "BAY",
    color: "#DC052D",
    emoji: "🔴",
    address: CONTRACT_ADDRESSES.FAN_TOKENS.BAYERN_MUNICH,
  },
] as const;
