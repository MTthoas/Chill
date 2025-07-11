// Contract addresses and chain configurations
export const CHAIN_IDS = {
  ETHEREUM_SEPOLIA: 11155111,
  BASE_SEPOLIA: 84532,
  OPTIMISM_SEPOLIA: 11155420,
  ARBITRUM_SEPOLIA: 421614,
  POLYGON_AMOY: 80002,
  AVALANCHE_FUJI: 43113,
  FLOW_TESTNET: 545, // Flow EVM testnet
} as const;

export const CHAIN_SELECTORS = {
  // Chainlink CCIP Chain Selectors
  ETHEREUM_SEPOLIA: "16015286601757825753",
  BASE_SEPOLIA: "10344971235874465080",
  OPTIMISM_SEPOLIA: "5224473277236331295",
  ARBITRUM_SEPOLIA: "3478487238524512106",
  POLYGON_AMOY: "16281711391670634445",
  AVALANCHE_FUJI: "14767482510784806043",
} as const;

export const CONTRACTS = {
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: {
    INTENTFI: "0xE9065052564fC9efC8f40D9a43350A86051C2235", // Deployed and verified on Sepolia
    INTENTFI_CCIP: "0xf3F2AB3d7B7ca3AD36c380A07bC546bA5d15238A", // Deployed and verified on Sepolia
    INTENTFI_ADVANCED: "0x29fFF4679406C0BE4d4Caf403e9864b16D954066", // Deployed and verified on Sepolia
    INTENTFI_GOVERNANCE: "0xE8F0BD08773169CB0B2ce3536D0b05ee91D2b62e", // Deployed and verified on Sepolia
    CCIP_ROUTER: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59", // Sepolia CCIP Router
    LINK_TOKEN: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // Sepolia LINK
  },
  [CHAIN_IDS.BASE_SEPOLIA]: {
    INTENTFI: "0x...",
    INTENTFI_CCIP: "0x...",
    INTENTFI_ADVANCED: "0x...",
    INTENTFI_GOVERNANCE: "0x...",
    CCIP_ROUTER: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93", // Base Sepolia CCIP Router
    LINK_TOKEN: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410", // Base Sepolia LINK
  },
  [CHAIN_IDS.OPTIMISM_SEPOLIA]: {
    INTENTFI: "0x...",
    INTENTFI_CCIP: "0x...",
    INTENTFI_ADVANCED: "0x...",
    INTENTFI_GOVERNANCE: "0x...",
    CCIP_ROUTER: "0x114A20A10b43D4115e5aeef7345a1A71d2a60C57", // Optimism Sepolia CCIP Router
    LINK_TOKEN: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410", // Optimism Sepolia LINK
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    INTENTFI: "0x...",
    INTENTFI_CCIP: "0x...",
    INTENTFI_ADVANCED: "0x...",
    INTENTFI_GOVERNANCE: "0x...",
    CCIP_ROUTER: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165", // Arbitrum Sepolia CCIP Router
    LINK_TOKEN: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E", // Arbitrum Sepolia LINK
  },
  [CHAIN_IDS.FLOW_TESTNET]: {
    INTENTFI: "0x...", // Your Flow deployment
    INTENTFI_CCIP: "0x...",
    INTENTFI_ADVANCED: "0x...",
    INTENTFI_GOVERNANCE: "0x...",
    CCIP_ROUTER: "0x...", // Flow CCIP Router (if available)
    LINK_TOKEN: "0x...", // Flow LINK token
  },
} as const;

export const RPC_URLS = {
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  [CHAIN_IDS.BASE_SEPOLIA]: "https://sepolia.base.org",
  [CHAIN_IDS.OPTIMISM_SEPOLIA]: "https://sepolia.optimism.io",
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: "https://sepolia-rollup.arbitrum.io/rpc",
  [CHAIN_IDS.FLOW_TESTNET]: "https://testnet.evm.nodes.onflow.org",
} as const;

export const SUPPORTED_CHAINS = Object.keys(CHAIN_IDS).map(
  (key) => CHAIN_IDS[key as keyof typeof CHAIN_IDS]
);

export const INTENT_TYPES = {
  SWAP: 0,
  BRIDGE: 1,
  ADVANCED: 2,
} as const;

export const TOKEN_ADDRESSES = {
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: {
    ETH: "0x0000000000000000000000000000000000000000",
    WETH: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    LINK: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  },
  [CHAIN_IDS.BASE_SEPOLIA]: {
    ETH: "0x0000000000000000000000000000000000000000",
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    LINK: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410",
  },
  // Add more tokens as needed
} as const;

export function getContractAddress(
  chainId: number,
  contractName: keyof (typeof CONTRACTS)[keyof typeof CONTRACTS]
) {
  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS];
  if (!contracts) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return contracts[contractName];
}

export function getChainSelector(chainId: number): string {
  const chainKey = Object.keys(CHAIN_IDS).find(
    (key) => CHAIN_IDS[key as keyof typeof CHAIN_IDS] === chainId
  ) as keyof typeof CHAIN_SELECTORS | undefined;

  if (!chainKey || !CHAIN_SELECTORS[chainKey]) {
    throw new Error(`No CCIP chain selector found for chain ID: ${chainId}`);
  }

  return CHAIN_SELECTORS[chainKey];
}

export function getTokenAddress(chainId: number, tokenSymbol: string): string {
  const tokens = TOKEN_ADDRESSES[chainId as keyof typeof TOKEN_ADDRESSES];
  if (!tokens) {
    throw new Error(`No tokens configured for chain ID: ${chainId}`);
  }

  const address = tokens[tokenSymbol as keyof typeof tokens];
  if (!address) {
    throw new Error(`Token ${tokenSymbol} not found on chain ${chainId}`);
  }

  return address;
}
