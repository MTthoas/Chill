// Re-export all the generated types
export * from "./types";

// Export configuration
export * from "./config";

// Export services
export * from "./ContractService";
export * from "./Web3Provider";

// Export specific contract factories for advanced usage
export {
  IntentFiAdvanced__factory,
  IntentFiCCIP__factory,
  IntentFiGovernance__factory,
  IntentFi__factory,
} from "./types/factories";

// Helper function to quickly setup everything
export function createIntentFiService(
  provider: import("ethers").Provider,
  signer: import("ethers").Signer,
  chainId: number
) {
  const { createContractService } = require("./ContractService");
  return createContractService(provider, signer, chainId);
}

// Type definitions for ease of use
export type { ContractIntent, IntentParams } from "./ContractService";

export type { WalletInfo } from "./Web3Provider";
