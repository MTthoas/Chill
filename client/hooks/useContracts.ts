import { useCallback, useEffect, useState } from "react";
import {
  ContractIntent,
  ContractService,
  IntentParams,
} from "../contracts/ContractService";
import { WalletInfo, web3Provider } from "../contracts/Web3Provider";

export interface UseContractsReturn {
  // Wallet state
  walletInfo: WalletInfo | null;
  isConnecting: boolean;
  isConnected: boolean;

  // Contract state
  contractService: ContractService | null;
  intents: ContractIntent[];
  isLoading: boolean;
  error: string | null;
  currentPrice: string | null;

  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  createIntent: (params: IntentParams) => Promise<string>;
  cancelIntent: (intentId: string) => Promise<string>;
  refreshIntents: () => Promise<void>;
  refreshPrice: () => Promise<void>;
  estimateGas: (params: IntentParams) => Promise<bigint>;
}

export function useContracts(): UseContractsReturn {
  // Wallet state
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Contract state
  const [contractService, setContractService] =
    useState<ContractService | null>(null);
  const [intents, setIntents] = useState<ContractIntent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);

  const isConnected = !!walletInfo?.isConnected;

  // Initialize contract service when wallet is connected
  useEffect(() => {
    if (walletInfo?.isConnected) {
      const provider = web3Provider.getProvider();
      const signer = web3Provider.getSigner();

      if (provider && signer) {
        const service = new ContractService(
          provider,
          signer,
          walletInfo.chainId
        );
        setContractService(service);

        // Setup event listeners
        service.setupEventListeners({
          onIntentCreated: (event) => {
            console.log("Intent created:", event);
            refreshIntents();
          },
          onIntentExecuted: (event) => {
            console.log("Intent executed:", event);
            refreshIntents();
          },
          onCrossChainMessageSent: (event) => {
            console.log("Cross-chain message sent:", event);
          },
        });
      }
    } else {
      if (contractService) {
        contractService.removeEventListeners();
      }
      setContractService(null);
    }

    return () => {
      if (contractService) {
        contractService.removeEventListeners();
      }
    };
  }, [walletInfo]);

  // Setup Web3 event listeners
  useEffect(() => {
    web3Provider.setupEventListeners({
      onAccountsChanged: (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          // Refresh wallet info
          connectWallet();
        }
      },
      onChainChanged: (chainId) => {
        const newChainId = parseInt(chainId, 16);
        if (walletInfo) {
          setWalletInfo({
            ...walletInfo,
            chainId: newChainId,
          });
        }
      },
      onDisconnect: () => {
        disconnectWallet();
      },
    });

    return () => {
      web3Provider.removeEventListeners();
    };
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async (): Promise<void> => {
    if (isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      const walletInfo = await web3Provider.connectWallet();
      setWalletInfo(walletInfo);
    } catch (error: any) {
      setError(error.message || "Failed to connect wallet");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  // Disconnect wallet
  const disconnectWallet = useCallback((): void => {
    web3Provider.disconnect();
    setWalletInfo(null);
    setContractService(null);
    setIntents([]);
    setCurrentPrice(null);
    setError(null);
  }, []);

  // Switch network
  const switchNetwork = useCallback(
    async (chainId: number): Promise<void> => {
      setError(null);

      try {
        await web3Provider.switchNetwork(chainId);

        if (walletInfo) {
          setWalletInfo({
            ...walletInfo,
            chainId,
          });
        }
      } catch (error: any) {
        setError(error.message || "Failed to switch network");
        throw error;
      }
    },
    [walletInfo]
  );

  // Create intent
  const createIntent = useCallback(
    async (params: IntentParams): Promise<string> => {
      if (!contractService) {
        throw new Error("Contract service not available");
      }

      setError(null);
      setIsLoading(true);

      try {
        const txHash = await contractService.createIntent(params);
        await refreshIntents(); // Refresh intents after creation
        return txHash;
      } catch (error: any) {
        setError(error.message || "Failed to create intent");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractService]
  );

  // Cancel intent
  const cancelIntent = useCallback(
    async (intentId: string): Promise<string> => {
      if (!contractService) {
        throw new Error("Contract service not available");
      }

      setError(null);
      setIsLoading(true);

      try {
        const txHash = await contractService.cancelIntent(intentId);
        await refreshIntents(); // Refresh intents after cancellation
        return txHash;
      } catch (error: any) {
        setError(error.message || "Failed to cancel intent");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractService]
  );

  // Refresh intents
  const refreshIntents = useCallback(async (): Promise<void> => {
    if (!contractService || !walletInfo?.address) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userIntents = await contractService.getUserIntents(
        walletInfo.address
      );
      setIntents(userIntents);
    } catch (error: any) {
      setError(error.message || "Failed to fetch intents");
    } finally {
      setIsLoading(false);
    }
  }, [contractService, walletInfo?.address]);

  // Refresh price
  const refreshPrice = useCallback(async (): Promise<void> => {
    if (!contractService) {
      return;
    }

    try {
      const price = await contractService.getLatestPrice();
      setCurrentPrice(price);
    } catch (error: any) {
      console.error("Failed to fetch price:", error);
      // Don't set error for price fetch failures as it's not critical
    }
  }, [contractService]);

  // Estimate gas
  const estimateGas = useCallback(
    async (params: IntentParams): Promise<bigint> => {
      if (!contractService) {
        throw new Error("Contract service not available");
      }

      return await contractService.estimateCreateIntentGas(params);
    },
    [contractService]
  );

  // Auto-refresh intents and price when contract service is available
  useEffect(() => {
    if (contractService && walletInfo?.address) {
      refreshIntents();
      refreshPrice();
    }
  }, [contractService, walletInfo?.address, refreshIntents, refreshPrice]);

  return {
    // Wallet state
    walletInfo,
    isConnecting,
    isConnected,

    // Contract state
    contractService,
    intents,
    isLoading,
    error,
    currentPrice,

    // Actions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    createIntent,
    cancelIntent,
    refreshIntents,
    refreshPrice,
    estimateGas,
  };
}

// Hook for getting contract service for specific chain (read-only)
export function useContractServiceForChain(chainId: number) {
  const [contractService, setContractService] =
    useState<ContractService | null>(null);

  useEffect(() => {
    try {
      const provider = web3Provider.createProviderForChain(chainId);
      // For read-only operations, we don't need a signer
      const service = new ContractService(provider, provider as any, chainId);
      setContractService(service);
    } catch (error) {
      console.error(
        `Failed to create contract service for chain ${chainId}:`,
        error
      );
    }
  }, [chainId]);

  return contractService;
}
