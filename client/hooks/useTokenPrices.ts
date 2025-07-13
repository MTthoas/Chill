import { useEffect, useState } from "react";

// Cache simple pour éviter trop d'appels API
const priceCache: { [key: string]: { data: { [symbol: string]: number }, timestamp: number } } = {};
const CACHE_DURATION = 60000; // 1 minute

/**
 * Hook pour récupérer les prix des tokens en temps réel via CoinGecko API
 * @param symbols - Array of token symbols (e.g., ["CHZ", "PSG", "BAR"])
 * @param refreshKey - Optional dependency to trigger refresh (useful for manual refresh)
 * @returns Object with symbol as key and price in USD as value
 */
export function useTokenPrices(symbols: string[], refreshKey?: any) {
  const [prices, setPrices] = useState<{ [symbol: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbols.length) return;

    async function fetchPrices() {
      setLoading(true);
      setError(null);
      
      // Vérifier le cache
      const cacheKey = symbols.sort().join(',');
      const cached = priceCache[cacheKey];
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION && !refreshKey) {
        setPrices(cached.data);
        setLoading(false);
        return;
      }
      
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

        // Prix de fallback en cas d'erreur API
        const fallbackPrices: { [symbol: string]: number } = {
          CHZ: 0.09,
          PSG: 2.85,
          CITY: 3.12,
          BAR: 2.45,
          ACM: 1.89,
          AFC: 2.78,
        };

        const ids = symbols
          .map((s) => coingeckoIds[s])
          .filter(Boolean)
          .join(",");

        if (!ids) {
          // Utiliser les prix de fallback si aucun ID trouvé
          const result: { [symbol: string]: number } = {};
          symbols.forEach(symbol => {
            if (fallbackPrices[symbol]) {
              result[symbol] = fallbackPrices[symbol];
            }
          });
          setPrices(result);
          setLoading(false);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout de 10s

        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
          { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        const result: { [symbol: string]: number } = {};

        for (const symbol of symbols) {
          const id = coingeckoIds[symbol];
          if (id && data[id] && data[id].usd) {
            result[symbol] = data[id].usd;
          } else if (fallbackPrices[symbol]) {
            // Utiliser le prix de fallback si l'API ne retourne pas de prix
            result[symbol] = fallbackPrices[symbol];
          }
        }

        setPrices(result);
        
        // Mettre en cache le résultat
        const cacheKey = symbols.sort().join(',');
        priceCache[cacheKey] = {
          data: result,
          timestamp: Date.now()
        };
        
      } catch (e) {
        console.warn("[tokenPrices] API unavailable, using fallback prices");
        setError(e instanceof Error ? e.message : "Failed to fetch prices");
        
        // Utiliser les prix de fallback en cas d'erreur
        const fallbackResult: { [symbol: string]: number } = {};
        const fallbackPrices: { [symbol: string]: number } = {
          CHZ: 0.09,
          PSG: 2.85,
          CITY: 3.12,
          BAR: 2.45,
          ACM: 1.89,
          AFC: 2.78,
        };
        
        symbols.forEach(symbol => {
          if (fallbackPrices[symbol]) {
            fallbackResult[symbol] = fallbackPrices[symbol];
          }
        });
        
        setPrices(fallbackResult);
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, [symbols, refreshKey]);

  return { prices, loading, error };
}
