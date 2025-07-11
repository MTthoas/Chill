import { ethers } from "ethers";
import {
  getChainSelector,
  getContractAddress,
  getTokenAddress,
  INTENT_TYPES,
} from "./config";
import {
  IntentFi,
  IntentFi__factory,
  IntentFiAdvanced,
  IntentFiAdvanced__factory,
  IntentFiCCIP,
  IntentFiCCIP__factory,
  IntentFiGovernance,
  IntentFiGovernance__factory,
} from "./types";

export interface IntentParams {
  type: "swap" | "bridge" | "advanced";
  triggerPrice?: string; // Price in USD with 8 decimals
  amount: string; // Amount in token units
  fromToken: string; // Token symbol
  toToken?: string; // For swaps
  fromChain: number; // Chain ID
  toChain?: number; // For bridges
  receiverAddress?: string; // For bridges
}

export interface ContractIntent {
  id: bigint;
  owner: string;
  intentType: bigint;
  triggerPrice: bigint;
  amount: bigint;
  tokenAddress: string;
  destinationChainSelector: bigint;
  destinationReceiver: string;
  status: bigint;
  createdAt: bigint;
  lastChecked: bigint;
}

export class ContractService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private chainId: number;

  constructor(
    provider: ethers.Provider,
    signer: ethers.Signer,
    chainId: number
  ) {
    this.provider = provider;
    this.signer = signer;
    this.chainId = chainId;
  }

  // Get contract instances
  getIntentFiContract(): IntentFi {
    const address = getContractAddress(this.chainId, "INTENTFI");
    return IntentFi__factory.connect(address, this.signer);
  }

  getIntentFiCCIPContract(): IntentFiCCIP {
    const address = getContractAddress(this.chainId, "INTENTFI_CCIP");
    return IntentFiCCIP__factory.connect(address, this.signer);
  }

  getIntentFiAdvancedContract(): IntentFiAdvanced {
    const address = getContractAddress(this.chainId, "INTENTFI_ADVANCED");
    return IntentFiAdvanced__factory.connect(address, this.signer);
  }

  getIntentFiGovernanceContract(): IntentFiGovernance {
    const address = getContractAddress(this.chainId, "INTENTFI_GOVERNANCE");
    return IntentFiGovernance__factory.connect(address, this.signer);
  }

  // Create a new intent
  async createIntent(params: IntentParams): Promise<string> {
    try {
      const contract = this.getIntentFiContract();

      // Convert parameters
      const intentType =
        INTENT_TYPES[params.type.toUpperCase() as keyof typeof INTENT_TYPES];
      const triggerPrice = params.triggerPrice
        ? ethers.parseUnits(params.triggerPrice, 8) // 8 decimals for Chainlink price feeds
        : 0n;
      const amount = ethers.parseUnits(params.amount, 18); // Assuming 18 decimals
      const tokenAddress = getTokenAddress(params.fromChain, params.fromToken);

      // For cross-chain operations
      const destinationChainSelector = params.toChain
        ? BigInt(getChainSelector(params.toChain))
        : 0n;
      const destinationReceiver =
        params.receiverAddress || (await this.signer.getAddress());

      console.log("Creating intent with params:", {
        intentType,
        triggerPrice: triggerPrice.toString(),
        amount: amount.toString(),
        tokenAddress,
        destinationChainSelector: destinationChainSelector.toString(),
        destinationReceiver,
      });

      const tx = await contract.createIntent(
        intentType,
        triggerPrice,
        amount,
        tokenAddress,
        destinationChainSelector,
        destinationReceiver
      );

      console.log("Intent creation transaction sent:", tx.hash);
      return tx.hash;
    } catch (error) {
      console.error("Error creating intent:", error);
      throw error;
    }
  }

  // Get user intents
  async getUserIntents(userAddress?: string): Promise<ContractIntent[]> {
    try {
      const contract = this.getIntentFiContract();
      const address = userAddress || (await this.signer.getAddress());

      const intentIds = await contract.getUserIntents(address);
      const intents: ContractIntent[] = [];

      for (const id of intentIds) {
        const intent = await contract.intents(id);
        intents.push({
          id,
          owner: intent.owner,
          intentType: intent.intentType,
          triggerPrice: intent.triggerPrice,
          amount: intent.amount,
          tokenAddress: intent.tokenAddress,
          destinationChainSelector: intent.destinationChainSelector,
          destinationReceiver: intent.destinationReceiver,
          status: intent.status,
          createdAt: intent.createdAt,
          lastChecked: intent.lastChecked,
        });
      }

      return intents;
    } catch (error) {
      console.error("Error fetching user intents:", error);
      throw error;
    }
  }

  // Cancel an intent
  async cancelIntent(intentId: string): Promise<string> {
    try {
      const contract = this.getIntentFiContract();
      const tx = await contract.cancelIntent(BigInt(intentId));
      console.log("Intent cancellation transaction sent:", tx.hash);
      return tx.hash;
    } catch (error) {
      console.error("Error canceling intent:", error);
      throw error;
    }
  }

  // Get latest price from Chainlink feed
  async getLatestPrice(): Promise<string> {
    try {
      const contract = this.getIntentFiContract();
      const price = await contract.getCurrentPrice();
      return ethers.formatUnits(price, 8); // 8 decimals for price feeds
    } catch (error) {
      console.error("Error fetching latest price:", error);
      throw error;
    }
  }

  // Check if upkeep is needed (for debugging)
  async checkUpkeep(): Promise<{ upkeepNeeded: boolean; performData: string }> {
    try {
      const contract = this.getIntentFiContract();
      const result = await contract.checkUpkeep("0x");
      return {
        upkeepNeeded: result.upkeepNeeded,
        performData: result.performData,
      };
    } catch (error) {
      console.error("Error checking upkeep:", error);
      throw error;
    }
  }

  // Estimate gas for intent creation
  async estimateCreateIntentGas(params: IntentParams): Promise<bigint> {
    try {
      const contract = this.getIntentFiContract();

      const intentType =
        INTENT_TYPES[params.type.toUpperCase() as keyof typeof INTENT_TYPES];
      const triggerPrice = params.triggerPrice
        ? ethers.parseUnits(params.triggerPrice, 8)
        : 0n;
      const amount = ethers.parseUnits(params.amount, 18);
      const tokenAddress = getTokenAddress(params.fromChain, params.fromToken);
      const destinationChainSelector = params.toChain
        ? BigInt(getChainSelector(params.toChain))
        : 0n;
      const destinationReceiver =
        params.receiverAddress || (await this.signer.getAddress());

      const gasEstimate = await contract.createIntent.estimateGas(
        intentType,
        triggerPrice,
        amount,
        tokenAddress,
        destinationChainSelector,
        destinationReceiver
      );

      return gasEstimate;
    } catch (error) {
      console.error("Error estimating gas:", error);
      throw error;
    }
  }

  // Listen to contract events
  setupEventListeners(callbacks: {
    onIntentCreated?: (event: any) => void;
    onIntentExecuted?: (event: any) => void;
    onCrossChainMessageSent?: (event: any) => void;
  }) {
    const contract = this.getIntentFiContract();

    if (callbacks.onIntentCreated) {
      contract.on(contract.filters.IntentCreated(), callbacks.onIntentCreated);
    }

    if (callbacks.onIntentExecuted) {
      contract.on(
        contract.filters.IntentExecuted(),
        callbacks.onIntentExecuted
      );
    }

    if (callbacks.onCrossChainMessageSent) {
      contract.on(
        contract.filters.CrossChainMessageSent(),
        callbacks.onCrossChainMessageSent
      );
    }
  }

  // Clean up event listeners
  removeEventListeners() {
    const contract = this.getIntentFiContract();
    contract.removeAllListeners();
  }
}

// Utility function to create contract service instance
export function createContractService(
  provider: ethers.Provider,
  signer: ethers.Signer,
  chainId: number
): ContractService {
  return new ContractService(provider, signer, chainId);
}
