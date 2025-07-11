import { ethers } from "ethers";
import { 
  ChilizFanTokenTrading, 
  ChilizFanTokenTrading__factory,
  FanToken__factory,
  ERC20,
  ERC20__factory
} from "./types";

export interface FanTokenInfo {
  tokenAddress: string;
  name: string;
  symbol: string;
  buyPrice: bigint;
  sellPrice: bigint;
  isActive: boolean;
  minTradeAmount: bigint;
}

export interface TradeResult {
  hash: string;
  tokenAmount: string;
  chzAmount: string;
  type: 'buy' | 'sell';
}

export interface TokenBalance {
  address: string;
  balance: bigint;
  formattedBalance: string;
  decimals: number;
}

export class ChilizTradingService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private tradingContract: ChilizFanTokenTrading;
  private chzToken: ERC20;

  constructor(
    provider: ethers.Provider,
    signer: ethers.Signer,
    tradingContractAddress: string,
    chzTokenAddress: string
  ) {
    this.provider = provider;
    this.signer = signer;
    this.tradingContract = ChilizFanTokenTrading__factory.connect(
      tradingContractAddress,
      signer
    );
    this.chzToken = ERC20__factory.connect(chzTokenAddress, signer);
  }

  /**
   * Obtenir tous les tokens fan supportés
   */
  async getSupportedTokens(): Promise<string[]> {
    try {
      return await this.tradingContract.getSupportedTokens();
    } catch (error) {
      console.error('Erreur lors de la récupération des tokens supportés:', error);
      throw error;
    }
  }

  /**
   * Obtenir les informations d'un fan token
   */
  async getFanTokenInfo(tokenAddress: string): Promise<FanTokenInfo> {
    try {
      const info = await this.tradingContract.getFanTokenInfo(tokenAddress);
      return {
        tokenAddress: info.tokenAddress,
        name: info.name,
        symbol: info.symbol,
        buyPrice: info.buyPrice,
        sellPrice: info.sellPrice,
        isActive: info.isActive,
        minTradeAmount: info.minTradeAmount,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos du token:', error);
      throw error;
    }
  }

  /**
   * Obtenir le prix d'achat pour une quantité donnée
   */
  async getBuyPrice(tokenAddress: string, tokenAmount: bigint): Promise<bigint> {
    try {
      return await this.tradingContract.getBuyPrice(tokenAddress, tokenAmount);
    } catch (error) {
      console.error('Erreur lors du calcul du prix d\'achat:', error);
      throw error;
    }
  }

  /**
   * Obtenir le prix de vente pour une quantité donnée
   */
  async getSellPrice(tokenAddress: string, tokenAmount: bigint): Promise<bigint> {
    try {
      return await this.tradingContract.getSellPrice(tokenAddress, tokenAmount);
    } catch (error) {
      console.error('Erreur lors du calcul du prix de vente:', error);
      throw error;
    }
  }

  /**
   * Obtenir les réserves d'un token
   */
  async getTokenReserves(tokenAddress: string): Promise<bigint> {
    try {
      return await this.tradingContract.getTokenReserves(tokenAddress);
    } catch (error) {
      console.error('Erreur lors de la récupération des réserves:', error);
      throw error;
    }
  }

  /**
   * Acheter des fan tokens
   */
  async buyFanTokens(tokenAddress: string, tokenAmount: bigint): Promise<TradeResult> {
    try {
      // Calculer le prix total
      const totalCost = await this.getBuyPrice(tokenAddress, tokenAmount);
      
      // Vérifier et approuver CHZ si nécessaire
      await this.ensureChzApproval(totalCost);
      
      // Exécuter l'achat
      const tx = await this.tradingContract.buyFanTokens(tokenAddress, tokenAmount);
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction échouée');
      }

      return {
        hash: receipt.hash,
        tokenAmount: ethers.formatEther(tokenAmount),
        chzAmount: ethers.formatEther(totalCost),
        type: 'buy'
      };
    } catch (error) {
      console.error('Erreur lors de l\'achat de tokens:', error);
      throw error;
    }
  }

  /**
   * Vendre des fan tokens
   */
  async sellFanTokens(tokenAddress: string, tokenAmount: bigint): Promise<TradeResult> {
    try {
      // Vérifier et approuver le fan token si nécessaire
      await this.ensureFanTokenApproval(tokenAddress, tokenAmount);
      
      // Calculer le prix de vente
      const sellPrice = await this.getSellPrice(tokenAddress, tokenAmount);
      
      // Exécuter la vente
      const tx = await this.tradingContract.sellFanTokens(tokenAddress, tokenAmount);
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction échouée');
      }

      return {
        hash: receipt.hash,
        tokenAmount: ethers.formatEther(tokenAmount),
        chzAmount: ethers.formatEther(sellPrice),
        type: 'sell'
      };
    } catch (error) {
      console.error('Erreur lors de la vente de tokens:', error);
      throw error;
    }
  }

  /**
   * Obtenir le solde CHZ de l'utilisateur
   */
  async getChzBalance(userAddress: string): Promise<TokenBalance> {
    try {
      const balance = await this.chzToken.balanceOf(userAddress);
      const decimals = await this.chzToken.decimals();
      
      return {
        address: await this.chzToken.getAddress(),
        balance,
        formattedBalance: ethers.formatUnits(balance, decimals),
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du solde CHZ:', error);
      throw error;
    }
  }

  /**
   * Obtenir le solde d'un fan token
   */
  async getFanTokenBalance(tokenAddress: string, userAddress: string): Promise<TokenBalance> {
    try {
      const fanToken = ERC20__factory.connect(tokenAddress, this.provider);
      const balance = await fanToken.balanceOf(userAddress);
      const decimals = await fanToken.decimals();
      
      return {
        address: tokenAddress,
        balance,
        formattedBalance: ethers.formatUnits(balance, decimals),
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du solde du fan token:', error);
      throw error;
    }
  }

  /**
   * Obtenir les détails d'un fan token (métadonnées)
   */
  async getFanTokenDetails(tokenAddress: string) {
    try {
      const fanToken = FanToken__factory.connect(tokenAddress, this.provider);
      
      const [name, symbol, teamName, league, country, logoURI, totalSupply, decimals] = 
        await Promise.all([
          fanToken.name(),
          fanToken.symbol(),
          fanToken.teamName(),
          fanToken.league(),
          fanToken.country(),
          fanToken.logoURI(),
          fanToken.totalSupply(),
          fanToken.decimals()
        ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        teamName,
        league,
        country,
        logoURI,
        totalSupply,
        decimals,
        formattedTotalSupply: ethers.formatUnits(totalSupply, decimals)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du fan token:', error);
      throw error;
    }
  }

  /**
   * S'assurer que CHZ est approuvé pour le trading
   */
  private async ensureChzApproval(amount: bigint): Promise<void> {
    try {
      const tradingContractAddress = await this.tradingContract.getAddress();
      const currentAllowance = await this.chzToken.allowance(
        await this.signer.getAddress(),
        tradingContractAddress
      );

      if (currentAllowance < amount) {
        // Approuver le montant nécessaire
        const approveTx = await this.chzToken.approve(tradingContractAddress, amount);
        await approveTx.wait();
      }
    } catch (error) {
      console.error('Erreur lors de l\'approbation CHZ:', error);
      throw error;
    }
  }

  /**
   * S'assurer que le fan token est approuvé pour le trading
   */
  private async ensureFanTokenApproval(tokenAddress: string, amount: bigint): Promise<void> {
    try {
      const fanToken = ERC20__factory.connect(tokenAddress, this.signer);
      const tradingContractAddress = await this.tradingContract.getAddress();
      const currentAllowance = await fanToken.allowance(
        await this.signer.getAddress(),
        tradingContractAddress
      );

      if (currentAllowance < amount) {
        // Approuver le montant nécessaire
        const approveTx = await fanToken.approve(tradingContractAddress, amount);
        await approveTx.wait();
      }
    } catch (error) {
      console.error('Erreur lors de l\'approbation du fan token:', error);
      throw error;
    }
  }

  /**
   * Écouter les événements de trading
   */
  onTokensPurchased(callback: (buyer: string, tokenAddress: string, tokenAmount: bigint, chzPaid: bigint) => void) {
    this.tradingContract.on(this.tradingContract.filters.TokensPurchased(), (buyer, tokenAddress, tokenAmount, chzPaid) => {
      callback(buyer, tokenAddress, tokenAmount, chzPaid);
    });
  }

  onTokensSold(callback: (seller: string, tokenAddress: string, tokenAmount: bigint, chzReceived: bigint) => void) {
    this.tradingContract.on(this.tradingContract.filters.TokensSold(), (seller, tokenAddress, tokenAmount, chzReceived) => {
      callback(seller, tokenAddress, tokenAmount, chzReceived);
    });
  }

  /**
   * Arrêter d'écouter les événements
   */
  removeAllListeners() {
    this.tradingContract.removeAllListeners();
  }
}
