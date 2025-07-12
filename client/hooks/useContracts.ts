import { CONTRACT_ADDRESSES } from "@/config/contracts";
import ChilizFanTokenTradingABI from "@/contracts/abi/ChilizFanTokenTrading.json";
import ERC20ABI from "@/contracts/abi/ERC20.json";
import FanTokenABI from "@/contracts/abi/FanToken.json";
import { Address, parseEther } from "viem";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

// Hook for reading contract data
export function useChilizFanTokenTradingRead(
  functionName: string,
  args?: any[],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.CHILIZ_FAN_TOKEN_TRADING,
    abi: ChilizFanTokenTradingABI,
    functionName,
    args,
    query: {
      enabled: options?.enabled ?? true,
    },
  });
}

// Hook for writing to contract
export function useChilizFanTokenTradingWrite() {
  const { writeContract, isPending, error, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const buyFanTokens = (
    tokenAddress: Address,
    amount: bigint,
    chzAmount: bigint
  ) => {
    writeContract({
      address: CONTRACT_ADDRESSES.CHILIZ_FAN_TOKEN_TRADING,
      abi: ChilizFanTokenTradingABI,
      functionName: "buyFanTokens",
      args: [tokenAddress, amount],
      value: chzAmount,
    });
  };

  const sellFanTokens = (tokenAddress: Address, amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.CHILIZ_FAN_TOKEN_TRADING,
      abi: ChilizFanTokenTradingABI,
      functionName: "sellFanTokens",
      args: [tokenAddress, amount],
    });
  };

  const addLiquidity = (tokenAddress: Address, amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.CHILIZ_FAN_TOKEN_TRADING,
      abi: ChilizFanTokenTradingABI,
      functionName: "addLiquidity",
      args: [tokenAddress, amount],
    });
  };

  const removeLiquidity = (tokenAddress: Address, amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.CHILIZ_FAN_TOKEN_TRADING,
      abi: ChilizFanTokenTradingABI,
      functionName: "removeLiquidity",
      args: [tokenAddress, amount],
    });
  };

  return {
    buyFanTokens,
    sellFanTokens,
    addLiquidity,
    removeLiquidity,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for reading fan token data
export function useFanTokenRead(
  tokenAddress: Address,
  functionName: string,
  args?: any[],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: tokenAddress,
    abi: FanTokenABI,
    functionName,
    args,
    query: {
      enabled: options?.enabled ?? true,
    },
  });
}

// Hook for ERC20 operations (approvals, balances, etc.)
export function useERC20Read(
  tokenAddress: Address,
  functionName: string,
  args?: any[],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName,
    args,
    query: {
      enabled: options?.enabled ?? true,
    },
  });
}

// Hook for ERC20 write operations
export function useERC20Write(tokenAddress: Address) {
  const { writeContract, isPending, error, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const approve = (spender: Address, amount: bigint) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  const transfer = (to: Address, amount: bigint) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: "transfer",
      args: [to, amount],
    });
  };

  return {
    approve,
    transfer,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Utility hooks for common contract reads
export function useFanTokenInfo(tokenAddress: Address) {
  const { data: name } = useFanTokenRead(tokenAddress, "name", [], {
    enabled: !!tokenAddress,
  });
  const { data: symbol } = useFanTokenRead(tokenAddress, "symbol", [], {
    enabled: !!tokenAddress,
  });
  const { data: totalSupply } = useFanTokenRead(
    tokenAddress,
    "totalSupply",
    [],
    { enabled: !!tokenAddress }
  );
  const { data: decimals } = useFanTokenRead(tokenAddress, "decimals", [], {
    enabled: !!tokenAddress,
  });

  return {
    name: name as string,
    symbol: symbol as string,
    totalSupply: totalSupply as bigint,
    decimals: decimals as number,
  };
}

export function useFanTokenBalance(
  tokenAddress: Address,
  userAddress?: Address
) {
  return useERC20Read(tokenAddress, "balanceOf", [userAddress], {
    enabled: !!tokenAddress && !!userAddress,
  });
}

export function useFanTokenAllowance(
  tokenAddress: Address,
  owner?: Address,
  spender?: Address
) {
  return useERC20Read(tokenAddress, "allowance", [owner, spender], {
    enabled: !!tokenAddress && !!owner && !!spender,
  });
}

// Hook to get fan token trading info
export function useFanTokenTradingInfo(tokenAddress: Address) {
  const { data: tokenInfo } = useChilizFanTokenTradingRead(
    "fanTokens",
    [tokenAddress],
    { enabled: !!tokenAddress }
  );

  const { data: buyPrice } = useChilizFanTokenTradingRead(
    "getBuyPrice",
    [tokenAddress, parseEther("1")], // Price for 1 token
    { enabled: !!tokenAddress }
  );

  const { data: sellPrice } = useChilizFanTokenTradingRead(
    "getSellPrice",
    [tokenAddress, parseEther("1")], // Price for 1 token
    { enabled: !!tokenAddress }
  );

  return {
    tokenInfo: tokenInfo as any,
    buyPrice: buyPrice as bigint,
    sellPrice: sellPrice as bigint,
  };
}
