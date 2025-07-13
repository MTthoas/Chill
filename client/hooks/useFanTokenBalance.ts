import { Contract } from "ethers";
import { JsonRpcProvider } from "ethers/providers";
import { formatUnits } from "ethers/utils";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";

// ABI minimal pour balanceOf
export const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
];

export const FAN_TOKEN_ADDRESSES = [
  // PSG - Paris Saint-Germain
  "0xc2661815C69c2B3924D3dd0c2C1358A1E38A3105",
  // Manchester City
  "0x6401b29F40a02578Ae44241560625232A01B3F79",
  // FC Barcelona
  "0x24f11f21767103D32827113eEd50B1F5FBE15151",
  // Juventus
  "0x3506424f91fd33084466f402d5d97f05f8e3b4af",
  // AC Milan
  "0x76CF23f1E7413E6e35dA70F136afA0Ad3b1A6d16",
  // Arsenal
  "0x0eb8D8c9D49d20B8b60c0AA51B9cCcF8C4BD08B7",
  // Real Madrid (upcoming)
  // "0x...", // Add when available
];

export function useFanTokenBalances() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);

    async function fetchBalances() {
      // Détection du bon endpoint RPC Chiliz
      let rpcUrl =
        (publicClient as any)?.transport?.url ||
        (publicClient as any)?.connection?.url ||
        "https://rpc.ankr.com/chiliz";
      console.log("[FanToken] Provider URL:", rpcUrl);
      console.log("[FanToken] Wallet:", address);
      const provider = new JsonRpcProvider(rpcUrl);
      const results = await Promise.all(
        FAN_TOKEN_ADDRESSES.map(async (contractAddress) => {
          try {
            const contract = new Contract(contractAddress, ERC20_ABI, provider);
            const [symbol, name, decimals, balance] = await Promise.all([
              contract.symbol(),
              contract.name(),
              contract.decimals(),
              contract.balanceOf(address),
            ]);
            console.log(
              `[FanToken] ${symbol} (${contractAddress}) balance:`,
              balance.toString()
            );
            return {
              contractAddress,
              symbol,
              name,
              decimals,
              readableBalance: Number(formatUnits(balance, decimals)),
              rawBalance: balance,
            };
          } catch (e) {
            console.error(`[FanToken] Erreur pour ${contractAddress}:`, e);
            return null;
          }
        })
      );
      setTokens(results.filter(Boolean));
      setLoading(false);
    }

    fetchBalances();
  }, [address, publicClient]);

  return { tokens, loading };
}

// Utility function to get token metadata by address
export function getTokenMetadata(address: string) {
  const tokenMap: { [key: string]: any } = {
    "0xc2661815C69c2B3924D3dd0c2C1358A1E38A3105": {
      symbol: "PSG",
      name: "Paris Saint-Germain",
      emoji: "🇫🇷",
      logo: "https://assets.socios.com/club-logos/psg-logo.png",
    },
    "0x6401b29F40a02578Ae44241560625232A01B3F79": {
      symbol: "CITY",
      name: "Manchester City",
      emoji: "🏴",
      logo: "https://assets.socios.com/club-logos/man-city-logo.png",
    },
    "0x24f11f21767103D32827113eEd50B1F5FBE15151": {
      symbol: "BAR",
      name: "FC Barcelona",
      emoji: "🇪🇸",
      logo: "https://assets.socios.com/club-logos/bar-logo.png",
    },
    "0x3506424f91fd33084466f402d5d97f05f8e3b4af": {
      symbol: "JUV",
      name: "Juventus",
      emoji: "🇮🇹",
      logo: "https://assets.socios.com/club-logos/juv-logo.png",
    },
    "0x76CF23f1E7413E6e35dA70F136afA0Ad3b1A6d16": {
      symbol: "ACM",
      name: "AC Milan",
      emoji: "🇮🇹",
      logo: "https://assets.socios.com/club-logos/acm-logo.png",
    },
    "0x0eb8D8c9D49d20B8b60c0AA51B9cCcF8C4BD08B7": {
      symbol: "AFC",
      name: "Arsenal",
      emoji: "🏴",
      logo: "https://assets.socios.com/club-logos/arsenal-logo.png",
    },
  };

  return (
    tokenMap[address] || {
      symbol: "UNKNOWN",
      name: "Unknown Token",
      emoji: "⚽",
      logo: null,
    }
  );
}

// Hook for trading operations using ERC20_ABI
export function useTokenTrading() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const approveToken = async (
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ) => {
    if (!address || !publicClient) throw new Error("Wallet not connected");

    try {
      // This would need to be implemented with actual transaction signing
      // For now, return a placeholder
      console.log(`Approving ${amount} tokens for ${spenderAddress}`);
      return { success: true, txHash: "0x..." };
    } catch (error) {
      console.error("Error approving token:", error);
      throw error;
    }
  };

  const transferToken = async (
    tokenAddress: string,
    toAddress: string,
    amount: string
  ) => {
    if (!address || !publicClient) throw new Error("Wallet not connected");

    try {
      // This would need to be implemented with actual transaction signing
      console.log(`Transferring ${amount} tokens to ${toAddress}`);
      return { success: true, txHash: "0x..." };
    } catch (error) {
      console.error("Error transferring token:", error);
      throw error;
    }
  };

  return {
    approveToken,
    transferToken,
  };
}
