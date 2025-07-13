import { useEffect, useState } from "react";
import { Contract } from "ethers";
import { JsonRpcProvider } from "ethers/providers";
import { formatUnits } from "ethers/utils";
import { useAccount, usePublicClient } from "wagmi";

// ABI minimal pour balanceOf
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
];

const FAN_TOKEN_ADDRESSES = [
  // PSG
  "0xc2661815C69c2B3924D3dd0c2C1358A1E38A3105",
  // Manchester City
  "0x6401b29F40a02578Ae44241560625232A01B3F79",
  // Ajoute ici d'autres adresses si besoin
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
