import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";

// Simple ERC20 ABI - just the functions we need
const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// Known Chiliz fan token addresses
const FAN_TOKEN_ADDRESSES = [
  {
    symbol: "PSG",
    name: "Paris Saint-Germain Fan Token",
    address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as `0x${string}`,
  },
  {
    symbol: "RMA",
    name: "Real Madrid Fan Token",
    address: "0x0165878A594ca255338adfa4d48449f69242Eb8F" as `0x${string}`,
  },
  {
    symbol: "BAR",
    name: "FC Barcelona Fan Token",
    address: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788" as `0x${string}`,
  },
  {
    symbol: "CITY",
    name: "Manchester City Fan Token",
    address: "0x9A676e781A523b5d0C0e43731313A708CB607508" as `0x${string}`,
  },
  {
    symbol: "JUV",
    name: "Juventus Fan Token",
    address: "0x68B1D87F95878fE05B998F19b66F4baba5De1aed" as `0x${string}`,
  },
  {
    symbol: "BAY",
    name: "Bayern Munich Fan Token",
    address: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1" as `0x${string}`,
  },
] as const;

export interface TokenBalance {
  symbol: string;
  name: string;
  contractAddress: string;
  balance: string;
  decimals: number;
  readableBalance: number;
  tokenBalance: string;
}

export function useOnChainTokenBalances() {
  const { address } = useAccount();

  // Create contract calls for each token (balance + decimals + symbol + name)
  const contracts = FAN_TOKEN_ADDRESSES.flatMap((token) => [
    {
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    },
    {
      address: token.address,
      abi: erc20Abi,
      functionName: "decimals",
    },
    {
      address: token.address,
      abi: erc20Abi,
      functionName: "symbol",
    },
    {
      address: token.address,
      abi: erc20Abi,
      functionName: "name",
    },
  ]);

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Process the results
  const tokens: TokenBalance[] = [];

  if (data && !isLoading) {
    for (let i = 0; i < FAN_TOKEN_ADDRESSES.length; i++) {
      const tokenInfo = FAN_TOKEN_ADDRESSES[i];
      const baseIndex = i * 4;

      const balanceResult = data[baseIndex];
      const decimalsResult = data[baseIndex + 1];
      const symbolResult = data[baseIndex + 2];
      const nameResult = data[baseIndex + 3];

      if (
        balanceResult?.status === "success" &&
        decimalsResult?.status === "success" &&
        symbolResult?.status === "success" &&
        nameResult?.status === "success"
      ) {
        const balance = balanceResult.result as unknown as bigint;
        const decimals = decimalsResult.result as unknown as number;
        const symbol = symbolResult.result as unknown as string;
        const name = nameResult.result as unknown as string;
        const readableBalance = Number(formatUnits(balance, decimals));

        // Only include tokens with balance > 0
        if (readableBalance > 0) {
          tokens.push({
            symbol,
            name,
            contractAddress: tokenInfo.address,
            balance: balance.toString(),
            decimals,
            readableBalance,
            tokenBalance: balance.toString(),
          });
        }
      }
    }
  }

  return {
    tokens,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    total: tokens.length,
  };
}
