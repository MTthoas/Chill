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
    address: "0xc2661815C69c2B3924D3dd0c2C1358A1E38A3105" as `0x${string}`,
  },
  {
    symbol: "RMA",
    name: "Real Madrid Fan Token",
    address: "0x6401b29F40a02578Ae44241560625232A01B3F79" as `0x${string}`,
  },
  {
    symbol: "BAR",
    name: "FC Barcelona Fan Token",
    address: "0xFD3C73b3B09D418841dd6Aff341b2d6e3abA433b" as `0x${string}`,
  },
  {
    symbol: "CITY",
    name: "Manchester City Fan Token",
    address: "0xF9C0F80a6c67b1B39bdDF00ecD57f2533ef5b688" as `0x${string}`,
  },
  {
    symbol: "BAY",
    name: "Bayern Munich Fan Token",
    address: "0x1d4343d35f0E0e14C14115876D01dEAa4792550b" as `0x${string}`,
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
