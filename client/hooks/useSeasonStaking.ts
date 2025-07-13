import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import SeasonFanTokenPoolABI from '../abi/SeasonFanTokenPool.json';

// Adresse du contrat déployé sur Chiliz
const SEASON_FAN_TOKEN_POOL_ADDRESS = ethers.getAddress('0xe304f1F987ea9eef9d67D64E930186eFc2B0Eb06');

// Configuration des tokens (adresses déployées)
const TOKENS = {
  PSG: {
    address: ethers.getAddress('0xc2661815C69c2B3924D3dd0c2C1358A1E38A3105'), // Fan Token déployé
    symbol: 'PSG',
    decimals: 18
  },
  REWARD: {
    address: ethers.getAddress('0x6401b29F40a02578Ae44241560625232A01B3F79'), // Reward Token déployé
    symbol: 'CHILL',
    decimals: 18
  }
};

// Mode développement pour désactiver les appels au contrat
const DEV_MODE = false;

export interface StakingInfo {
  stakedAmount: string;
  pendingRewards: string;
  seasonEndTimestamp: number;
  fanTokenBalance: string;
  poolClosed: boolean;
}

export const useSeasonStaking = () => {
  const [stakingInfo, setStakingInfo] = useState<StakingInfo>({
    stakedAmount: '0',
    pendingRewards: '0',
    seasonEndTimestamp: 1753660799, // Season End fourni
    fanTokenBalance: '0',
    poolClosed: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Utiliser les hooks Wagmi pour la connexion wallet
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  // Fonction pour obtenir le provider en lecture seule
  const getReadOnlyProvider = () => {
    return new ethers.JsonRpcProvider('https://rpc.ankr.com/chiliz'); // RPC Chiliz Mainnet
  };

  // Fonction pour obtenir le contract avec signer pour les transactions
  const getContract = async () => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    // Créer un provider ethers à partir du wallet client Wagmi
    const provider = new ethers.BrowserProvider(walletClient.transport, {
      name: 'chiliz',
      chainId: 8888, // Chiliz Mainnet
    });
    
    const signer = await provider.getSigner();
    return new ethers.Contract(SEASON_FAN_TOKEN_POOL_ADDRESS, SeasonFanTokenPoolABI.abi, signer);
  };

  // Charger les informations de staking
  const fetchStakingInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isConnected || !address) {
        setError('Wallet not connected');
        setStakingInfo({
          stakedAmount: '0',
          pendingRewards: '0',
          seasonEndTimestamp: 1753660799, // Season End fourni
          fanTokenBalance: '0',
          poolClosed: false,
        });
        return;
      }

      const provider = getReadOnlyProvider();
      const contract = new ethers.Contract(SEASON_FAN_TOKEN_POOL_ADDRESS, SeasonFanTokenPoolABI.abi, provider);

      // Récupérer les informations du contrat
      const [stakedAmount, pendingRewards, seasonEnd] = await Promise.all([
        contract.staked(address),
        contract.rewards(address),
        contract.seasonEnd(),
      ]);

      // Récupérer le solde de fan token
      const fanTokenContract = new ethers.Contract(
        TOKENS.PSG.address,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      const fanTokenBalance = await fanTokenContract.balanceOf(address);

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const poolClosed = currentTimestamp >= Number(seasonEnd);

      setStakingInfo({
        stakedAmount: ethers.formatUnits(stakedAmount, TOKENS.PSG.decimals),
        pendingRewards: ethers.formatUnits(pendingRewards, TOKENS.REWARD.decimals),
        seasonEndTimestamp: Number(seasonEnd),
        fanTokenBalance: ethers.formatUnits(fanTokenBalance, TOKENS.PSG.decimals),
        poolClosed,
      });
    } catch (err) {
      console.error('Error fetching staking info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch staking info');
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  // Fonction pour staker des tokens
  const stake = async (amount: string) => {
    try {
      setLoading(true);
      setError(null);

      const contract = await getContract();
      const amountWei = ethers.parseUnits(amount, TOKENS.PSG.decimals);

      // D'abord, approuver le contrat pour dépenser les tokens
      const fanTokenContract = new ethers.Contract(
        TOKENS.PSG.address,
        ['function approve(address,uint256) returns (bool)'],
        await contract.runner
      );
      
      const approveTx = await fanTokenContract.approve(SEASON_FAN_TOKEN_POOL_ADDRESS, amountWei);
      await approveTx.wait();

      // Ensuite, staker
      const stakeTx = await contract.stake(amountWei);
      await stakeTx.wait();

      // Recharger les informations
      await fetchStakingInfo();
      
      return true;
    } catch (err) {
      console.error('Error staking:', err);
      setError(err instanceof Error ? err.message : 'Failed to stake');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les récompenses
  const claim = async () => {
    try {
      setLoading(true);
      setError(null);

      const contract = await getContract();
      const claimTx = await contract.claim();
      await claimTx.wait();

      // Recharger les informations
      await fetchStakingInfo();
      
      return true;
    } catch (err) {
      console.error('Error claiming:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour retirer les tokens stakés
  const withdraw = async () => {
    try {
      setLoading(true);
      setError(null);

      const contract = await getContract();
      const withdrawTx = await contract.withdraw();
      await withdrawTx.wait();

      // Recharger les informations
      await fetchStakingInfo();
      
      return true;
    } catch (err) {
      console.error('Error withdrawing:', err);
      setError(err instanceof Error ? err.message : 'Failed to withdraw');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Charger les informations au montage
  useEffect(() => {
    fetchStakingInfo();
  }, [fetchStakingInfo]);

  return {
    stakingInfo,
    loading,
    error,
    stake,
    claim,
    withdraw,
    refetch: fetchStakingInfo,
  };
};
