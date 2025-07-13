import { useState, useEffect, useCallback } from 'react';

// Déclaration du type pour window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletInfo {
  address: string | null;
  connected: boolean;
  chainId: number | null;
}

export const useWallet = () => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: null,
    connected: false,
    chainId: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier la connexion du wallet
  const checkConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (accounts && accounts.length > 0) {
          setWalletInfo({
            address: accounts[0],
            connected: true,
            chainId: parseInt(chainId, 16),
          });
        } else {
          setWalletInfo({
            address: null,
            connected: false,
            chainId: chainId ? parseInt(chainId, 16) : null,
          });
        }
      } else {
        setError('Wallet not available');
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to check wallet connection');
    } finally {
      setLoading(false);
    }
  }, []);

  // Connecter le wallet
  const connect = async () => {
    try {
      setLoading(true);
      setError(null);

      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (accounts && accounts.length > 0) {
          setWalletInfo({
            address: accounts[0],
            connected: true,
            chainId: parseInt(chainId, 16),
          });
          return true;
        }
      } else {
        setError('Wallet not available');
      }
      
      return false;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Changer de réseau vers Chiliz
  const switchToChiliz = async () => {
    try {
      setLoading(true);
      setError(null);

      if (typeof window !== 'undefined' && window.ethereum) {
        // Chiliz Mainnet (Chain ID: 88888)
        const chilizChainId = '0x15B38'; // 88888 en hexadécimal
        
        try {
          // Essayer de changer vers Chiliz
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chilizChainId }],
          });
        } catch (switchError: any) {
          // Si le réseau n'est pas ajouté, l'ajouter
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: chilizChainId,
                  chainName: 'Chiliz Chain',
                  nativeCurrency: {
                    name: 'CHZ',
                    symbol: 'CHZ',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc.ankr.com/chiliz'],
                  blockExplorerUrls: ['https://scan.chiliz.com/'],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
        
        // Rafraîchir les informations après le changement
        await checkConnection();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error switching to Chiliz:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch to Chiliz network');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Vérifier la connexion au montage
  useEffect(() => {
    checkConnection();
    
    // Écouter les changements de compte et de chaîne
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletInfo(prev => ({
            ...prev,
            address: accounts[0],
            connected: true,
          }));
        } else {
          setWalletInfo(prev => ({
            ...prev,
            address: null,
            connected: false,
          }));
        }
      };

      const handleChainChanged = (chainId: string) => {
        setWalletInfo(prev => ({
          ...prev,
          chainId: parseInt(chainId, 16),
        }));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [checkConnection]);

  return {
    walletInfo,
    loading,
    error,
    connect,
    checkConnection,
    switchToChiliz,
    isChilizNetwork: walletInfo.chainId === 88888,
  };
};
