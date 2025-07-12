import { formatUnits } from "viem";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { CHILIZ_CONTRACTS } from "../contracts/chilizConfig";

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
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Get fan token addresses for current chain
  const chainConfig =
    CHILIZ_CONTRACTS[chainId as keyof typeof CHILIZ_CONTRACTS];

  console.log("useOnChainTokenBalances Debug:", {
    chainId,
    isConnected,
    address,
    chainConfig,
    availableChains: Object.keys(CHILIZ_CONTRACTS),
  });

  // Convert config to array format, fallback to localhost if chain not supported
  const fanTokenAddresses = chainConfig
    ? Object.entries(chainConfig.SUPPORTED_FAN_TOKENS).map(
        ([symbol, address]) => ({
          symbol,
          name: `${symbol} Fan Token`,
          address: address as `0x${string}`,
        })
      )
    : Object.entries(CHILIZ_CONTRACTS[31337].SUPPORTED_FAN_TOKENS).map(
        ([symbol, address]) => ({
          symbol,
          name: `${symbol} Fan Token`,
          address: address as `0x${string}`,
        })
      );

  console.log("Fan token addresses:", fanTokenAddresses);

  // Only create contracts if user is connected and we have valid addresses
  const contracts =
    isConnected && address && fanTokenAddresses.length > 0
      ? fanTokenAddresses.flatMap((token) => [
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
        ])
      : [];

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!address && !!isConnected && contracts.length > 0,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  console.log("Read contracts debug:", {
    data,
    isLoading,
    error: error?.message,
    contractsLength: contracts.length,
    fanTokenAddressesLength: fanTokenAddresses.length,
  });

  // Process the results
  const tokens: TokenBalance[] = [];

  if (data && !isLoading) {
    for (let i = 0; i < fanTokenAddresses.length; i++) {
      const tokenInfo = fanTokenAddresses[i];
      const baseIndex = i * 4;

      const balanceResult = data[baseIndex];
      const decimalsResult = data[baseIndex + 1];
      const symbolResult = data[baseIndex + 2];
      const nameResult = data[baseIndex + 3];

      console.log(`Token ${tokenInfo.symbol} (${tokenInfo.address}) results:`, {
        balance: balanceResult,
        decimals: decimalsResult,
        symbol: symbolResult,
        name: nameResult,
      });

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

        // Include all tokens, even with 0 balance for debugging
        tokens.push({
          symbol,
          name,
          contractAddress: tokenInfo.address,
          balance: balance.toString(),
          decimals,
          readableBalance,
          tokenBalance: balance.toString(),
        });
      } else {
        // Log failed calls for debugging
        console.warn(`Failed to get data for token ${tokenInfo.symbol}:`, {
          balanceError:
            balanceResult?.status === "failure" ? balanceResult.error : null,
          decimalsError:
            decimalsResult?.status === "failure" ? decimalsResult.error : null,
          symbolError:
            symbolResult?.status === "failure" ? symbolResult.error : null,
          nameError: nameResult?.status === "failure" ? nameResult.error : null,
        });
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
