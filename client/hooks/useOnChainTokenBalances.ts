import { FAN_TOKEN_METADATA } from "@/config/contracts";
import { useCallback, useEffect, useState } from "react";
import { Address, erc20Abi } from "viem";
import { useAccount, useReadContracts } from "wagmi";

export interface TokenBalance {
  contractAddress: Address;
  symbol: string;
  balance: bigint;
  readableBalance: number;
  decimals: number;
}

// Get fan token addresses from metadata
const FAN_TOKEN_ADDRESSES: Address[] = FAN_TOKEN_METADATA.map(
  (token) => token.address
).filter((address) => address !== ("0x..." as Address)); // Filter out placeholder addresses

export function useOnChainTokenBalances() {
  const { address, isConnected } = useAccount();
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create contracts array for batch reading
  const contracts = FAN_TOKEN_ADDRESSES.flatMap((tokenAddress) => [
    {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as Address],
    },
    {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "symbol",
    },
    {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
    },
  ]);

  const {
    data: contractResults,
    isLoading,
    refetch: refetchContracts,
  } = useReadContracts({
    contracts: contracts,
    query: {
      enabled: isConnected && !!address && FAN_TOKEN_ADDRESSES.length > 0,
    },
  });

  const processTokenData = useCallback(() => {
    if (!contractResults || !isConnected) {
      setTokens([]);
      return;
    }

    try {
      const tokenBalances: TokenBalance[] = [];

      // Process results in groups of 3 (balance, symbol, decimals)
      for (let i = 0; i < FAN_TOKEN_ADDRESSES.length; i++) {
        const balanceResult = contractResults[i * 3];
        const symbolResult = contractResults[i * 3 + 1];
        const decimalsResult = contractResults[i * 3 + 2];

        if (
          balanceResult.status === "success" &&
          symbolResult.status === "success" &&
          decimalsResult.status === "success"
        ) {
          const balance = balanceResult.result as bigint;
          const symbol = symbolResult.result as string;
          const decimals = decimalsResult.result as number;
          const readableBalance = Number(balance) / Math.pow(10, decimals);

          // Include all tokens, even with zero balance for display purposes
          tokenBalances.push({
            contractAddress: FAN_TOKEN_ADDRESSES[i],
            symbol,
            balance,
            readableBalance,
            decimals,
          });
        }
      }

      setTokens(tokenBalances);
      setError(null);
    } catch (err) {
      console.error("Error processing token data:", err);
      setError("Failed to process token data");
      setTokens([]);
    }
  }, [contractResults, isConnected]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    processTokenData();
  }, [processTokenData]);

  useEffect(() => {
    if (!isConnected) {
      setTokens([]);
      setError(null);
    }
  }, [isConnected]);

  const refetch = useCallback(async () => {
    if (!isConnected || !address) {
      setTokens([]);
      return;
    }

    setLoading(true);
    try {
      await refetchContracts();
    } catch (err) {
      console.error("Error refetching tokens:", err);
      setError("Failed to fetch token balances");
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, refetchContracts]);

  return {
    tokens,
    loading,
    error,
    refetch,
  };
}
