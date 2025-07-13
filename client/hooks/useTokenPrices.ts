import { useEffect, useState } from "react";

/**
 * Hook pour récupérer les prix des tokens en temps réel via CoinGecko API
 * @param symbols - Array of token symbols (e.g., ["CHZ", "PSG", "BAR"])
 * @param refreshKey - Optional dependency to trigger refresh (useful for manual refresh)
 * @returns Object with symbol as key and price in USD as value
 */
export function useTokenPrices(symbols: string[], refreshKey?: any) {
  const [prices, setPrices] = useState<{ [symbol: string]: number }>({});

  useEffect(() => {
    if (!symbols.length) return;

    async function fetchPrices() {
      try {
        // Mapping symbol -> CoinGecko ID
        const coingeckoIds: { [symbol: string]: string } = {
          CHZ: "chiliz",
          PSG: "paris-saint-germain-fan-token",
          CITY: "manchester-city-fan-token",
          BAR: "fc-barcelona-fan-token",
          ACM: "ac-milan-fan-token",
          AFC: "arsenal-fan-token",
        };

        const ids = symbols
          .map((s) => coingeckoIds[s])
          .filter(Boolean)
          .join(",");

        if (!ids) return;

        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        );

        const data = await res.json();
        const result: { [symbol: string]: number } = {};

        for (const symbol of symbols) {
          const id = coingeckoIds[symbol];
          if (id && data[id] && data[id].usd) {
            result[symbol] = data[id].usd;
          }
        }

        setPrices(result);
      } catch (e) {
        console.error("[TokenPrices] Error fetching prices:", e);
        setPrices({});
      }
    }

    fetchPrices();
  }, [symbols, refreshKey]);

  return prices;
}
