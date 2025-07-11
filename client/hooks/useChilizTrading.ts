import { useEffect, useState, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { ChilizTradingService, FanTokenInfo, TradeResult, TokenBalance } from '../contracts/ChilizTradingService';
import { getContractAddresses, isChilizChain } from '../contracts/chilizConfig';

interface UseChilizTradingReturn {
  service: ChilizTradingService | null;
  isLoading: boolean;
  error: string | null;
  isChilizNetwork: boolean;
  
  // Data
  supportedTokens: string[];
  fanTokensInfo: { [address: string]: FanTokenInfo };
  userBalances: { [address: string]: TokenBalance };
  chzBalance: TokenBalance | null;
  
  // Actions
  refreshData: () => Promise<void>;
  buyTokens: (tokenAddress: string, amount: string) => Promise<TradeResult>;
  sellTokens: (tokenAddress: string, amount: string) => Promise<TradeResult>;
  getBuyQuote: (tokenAddress: string, amount: string) => Promise<string>;
  getSellQuote: (tokenAddress: string, amount: string) => Promise<string>;
}

export function useChilizTrading(): UseChilizTradingReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [service, setService] = useState<ChilizTradingService | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportedTokens, setSupportedTokens] = useState<string[]>([]);
  const [fanTokensInfo, setFanTokensInfo] = useState<{ [address: string]: FanTokenInfo }>({});
  const [userBalances, setUserBalances] = useState<{ [address: string]: TokenBalance }>({});
  const [chzBalance, setChzBalance] = useState<TokenBalance | null>(null);

  const isChilizNetwork = isChilizChain(chainId);

  // Initialiser le service
  useEffect(() => {
    if (!isConnected || !address || !isChilizNetwork) {
      setService(null);
      return;
    }

    const initService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Obtenir le provider et signer
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          
          const contracts = getContractAddresses(chainId);
          if (!contracts.FAN_TOKEN_TRADING || !contracts.CHZ_TOKEN) {
            throw new Error('Adresses de contrats non configurées pour cette chaîne');
          }

          const tradingService = new ChilizTradingService(
            provider,
            signer,
            contracts.FAN_TOKEN_TRADING,
            contracts.CHZ_TOKEN
          );

          setService(tradingService);
        }
      } catch (err) {
        console.error('Erreur lors de l\'initialisation du service:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    initService();
  }, [isConnected, address, chainId, isChilizNetwork]);

  // Charger les données
  const refreshData = useCallback(async () => {
    if (!service || !address) return;

    try {
      setIsLoading(true);
      setError(null);

      // Charger les tokens supportés
      const tokens = await service.getSupportedTokens();
      setSupportedTokens(tokens);

      // Charger les infos des tokens
      const tokensInfo: { [address: string]: FanTokenInfo } = {};
      const balances: { [address: string]: TokenBalance } = {};

      await Promise.all(
        tokens.map(async (tokenAddress) => {
          try {
            const [info, balance] = await Promise.all([
              service.getFanTokenInfo(tokenAddress),
              service.getFanTokenBalance(tokenAddress, address)
            ]);
            tokensInfo[tokenAddress] = info;
            balances[tokenAddress] = balance;
          } catch (err) {
            console.error(`Erreur pour le token ${tokenAddress}:`, err);
          }
        })
      );

      setFanTokensInfo(tokensInfo);
      setUserBalances(balances);

      // Charger le solde CHZ
      const chzBal = await service.getChzBalance(address);
      setChzBalance(chzBal);

    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du rafraîchissement');
    } finally {
      setIsLoading(false);
    }
  }, [service, address]);

  // Charger les données initiales
  useEffect(() => {
    if (service && address) {
      refreshData();
    }
  }, [service, address, refreshData]);

  // Actions de trading
  const buyTokens = useCallback(async (tokenAddress: string, amount: string): Promise<TradeResult> => {
    if (!service) throw new Error('Service non initialisé');
    
    const tokenAmount = ethers.parseEther(amount);
    const result = await service.buyFanTokens(tokenAddress, tokenAmount);
    
    // Rafraîchir les données après l'achat
    await refreshData();
    
    return result;
  }, [service, refreshData]);

  const sellTokens = useCallback(async (tokenAddress: string, amount: string): Promise<TradeResult> => {
    if (!service) throw new Error('Service non initialisé');
    
    const tokenAmount = ethers.parseEther(amount);
    const result = await service.sellFanTokens(tokenAddress, tokenAmount);
    
    // Rafraîchir les données après la vente
    await refreshData();
    
    return result;
  }, [service, refreshData]);

  const getBuyQuote = useCallback(async (tokenAddress: string, amount: string): Promise<string> => {
    if (!service) throw new Error('Service non initialisé');
    
    const tokenAmount = ethers.parseEther(amount);
    const price = await service.getBuyPrice(tokenAddress, tokenAmount);
    
    return ethers.formatEther(price);
  }, [service]);

  const getSellQuote = useCallback(async (tokenAddress: string, amount: string): Promise<string> => {
    if (!service) throw new Error('Service non initialisé');
    
    const tokenAmount = ethers.parseEther(amount);
    const price = await service.getSellPrice(tokenAddress, tokenAmount);
    
    return ethers.formatEther(price);
  }, [service]);

  return {
    service,
    isLoading,
    error,
    isChilizNetwork,
    supportedTokens,
    fanTokensInfo,
    userBalances,
    chzBalance,
    refreshData,
    buyTokens,
    sellTokens,
    getBuyQuote,
    getSellQuote,
  };
}
