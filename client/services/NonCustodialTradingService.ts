import { ethers } from 'ethers';

export interface TransactionRequest {
  to: string;
  data: string;
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface TradeTransaction {
  type: 'buy' | 'sell';
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
  estimatedChzAmount: string;
  estimatedGas: string;
  transactionRequest: TransactionRequest;
}

export class NonCustodialTradingService {
  constructor(
    private provider: ethers.BrowserProvider,
    private signer: ethers.JsonRpcSigner,
    private tradingContractAddress: string,
    private chzTokenAddress: string
  ) {}

  /**
   * Prépare une transaction d'achat sans l'exécuter
   */
  async prepareBuyTransaction(
    tokenAddress: string, 
    tokenSymbol: string,
    chzAmount: string
  ): Promise<TradeTransaction> {
    try {
      // ABI simplifié pour l'interaction avec le contrat de trading
      const tradingABI = [
        'function buyTokens(address tokenAddress, uint256 chzAmount) external',
        'function getBuyQuote(address tokenAddress, uint256 chzAmount) external view returns (uint256)',
        'function estimateGas(address tokenAddress, uint256 chzAmount) external view returns (uint256)'
      ];

      const tradingContract = new ethers.Contract(
        this.tradingContractAddress,
        tradingABI,
        this.signer
      );

      // Convertir le montant en Wei
      const chzAmountWei = ethers.parseEther(chzAmount);

      // Obtenir le quote (nombre de tokens à recevoir)
      const expectedTokens = await tradingContract.getBuyQuote(tokenAddress, chzAmountWei);
      const expectedTokensFormatted = ethers.formatEther(expectedTokens);

      // Estimer le gas de manière alternative
      const gasEstimate = await this.provider.estimateGas({
        to: this.tradingContractAddress,
        data: tradingContract.interface.encodeFunctionData('buyTokens', [tokenAddress, chzAmountWei]),
        value: chzAmountWei,
      });
      const gasPrice = await this.provider.getFeeData();
      const estimatedGasCost = gasEstimate * (gasPrice.gasPrice || BigInt(20000000000)); // 20 gwei par défaut

      // Préparer les données de la transaction
      const data = tradingContract.interface.encodeFunctionData('buyTokens', [
        tokenAddress,
        chzAmountWei
      ]);

      const transactionRequest: TransactionRequest = {
        to: this.tradingContractAddress,
        data,
        value: chzAmountWei.toString(),
        gasLimit: (gasEstimate + BigInt(10000)).toString(), // Ajouter une marge
        gasPrice: gasPrice.gasPrice?.toString(),
      };

      return {
        type: 'buy',
        tokenAddress,
        tokenSymbol,
        amount: expectedTokensFormatted,
        estimatedChzAmount: chzAmount,
        estimatedGas: ethers.formatEther(estimatedGasCost),
        transactionRequest,
      };
    } catch (error) {
      console.error('Erreur lors de la préparation de la transaction d\'achat:', error);
      throw new Error('Impossible de préparer la transaction d\'achat');
    }
  }

  /**
   * Prépare une transaction de vente sans l'exécuter
   */
  async prepareSellTransaction(
    tokenAddress: string,
    tokenSymbol: string, 
    tokenAmount: string
  ): Promise<TradeTransaction> {
    try {
      const tradingABI = [
        'function sellTokens(address tokenAddress, uint256 tokenAmount) external',
        'function getSellQuote(address tokenAddress, uint256 tokenAmount) external view returns (uint256)',
      ];

      const tradingContract = new ethers.Contract(
        this.tradingContractAddress,
        tradingABI,
        this.signer
      );

      const tokenAmountWei = ethers.parseEther(tokenAmount);

      // Obtenir le quote (CHZ à recevoir)
      const expectedChz = await tradingContract.getSellQuote(tokenAddress, tokenAmountWei);
      const expectedChzFormatted = ethers.formatEther(expectedChz);

      // Estimer le gas de manière alternative
      const gasEstimate = await this.provider.estimateGas({
        to: this.tradingContractAddress,
        data: tradingContract.interface.encodeFunctionData('sellTokens', [tokenAddress, tokenAmountWei]),
      });
      const gasPrice = await this.provider.getFeeData();
      const estimatedGasCost = gasEstimate * (gasPrice.gasPrice || BigInt(20000000000));

      // Préparer les données de la transaction
      const data = tradingContract.interface.encodeFunctionData('sellTokens', [
        tokenAddress,
        tokenAmountWei
      ]);

      const transactionRequest: TransactionRequest = {
        to: this.tradingContractAddress,
        data,
        gasLimit: (gasEstimate + BigInt(10000)).toString(),
        gasPrice: gasPrice.gasPrice?.toString(),
      };

      return {
        type: 'sell',
        tokenAddress,
        tokenSymbol,
        amount: tokenAmount,
        estimatedChzAmount: expectedChzFormatted,
        estimatedGas: ethers.formatEther(estimatedGasCost),
        transactionRequest,
      };
    } catch (error) {
      console.error('Erreur lors de la préparation de la transaction de vente:', error);
      throw new Error('Impossible de préparer la transaction de vente');
    }
  }

  /**
   * Signe et diffuse une transaction préparée
   */
  async signAndBroadcastTransaction(tradeTransaction: TradeTransaction): Promise<string> {
    try {
      // Afficher un message d'info à l'utilisateur
      console.log('🔐 Signature de la transaction en cours...');

      // Préparer la transaction complète
      const transaction = {
        to: tradeTransaction.transactionRequest.to,
        data: tradeTransaction.transactionRequest.data,
        value: tradeTransaction.transactionRequest.value || '0',
        gasLimit: tradeTransaction.transactionRequest.gasLimit,
        gasPrice: tradeTransaction.transactionRequest.gasPrice,
      };

      // Signer la transaction avec le wallet de l'utilisateur
      const signedTransaction = await this.signer.sendTransaction(transaction);
      
      console.log('📡 Transaction diffusée:', signedTransaction.hash);
      
      // Attendre la confirmation
      const receipt = await signedTransaction.wait();
      
      if (receipt?.status === 1) {
        console.log('✅ Transaction confirmée:', receipt.hash);
        return receipt.hash;
      } else {
        throw new Error('La transaction a échoué');
      }
    } catch (error: any) {
      console.error('Erreur lors de la signature/diffusion:', error);
      
      // Messages d'erreur spécifiques
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction annulée par l\'utilisateur');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Fonds insuffisants pour cette transaction');
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new Error('Impossible d\'estimer le gas - vérifiez les paramètres');
      } else {
        throw new Error(error.message || 'Erreur lors de la transaction');
      }
    }
  }

  /**
   * Vérifie les approbations de tokens nécessaires
   */
  async checkTokenApproval(tokenAddress: string, amount: string): Promise<boolean> {
    try {
      const tokenABI = [
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)'
      ];

      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.signer);
      const userAddress = await this.signer.getAddress();
      
      const allowance = await tokenContract.allowance(userAddress, this.tradingContractAddress);
      const amountWei = ethers.parseEther(amount);
      
      return allowance >= amountWei;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'approbation:', error);
      return false;
    }
  }

  /**
   * Prépare une transaction d'approbation de token
   */
  async prepareApprovalTransaction(tokenAddress: string, amount: string): Promise<TransactionRequest> {
    const tokenABI = [
      'function approve(address spender, uint256 amount) external returns (bool)'
    ];

    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.signer);
    const amountWei = ethers.parseEther(amount);

    const data = tokenContract.interface.encodeFunctionData('approve', [
      this.tradingContractAddress,
      amountWei
    ]);

    return {
      to: tokenAddress,
      data,
    };
  }

  /**
   * Obtient le statut d'une transaction
   */
  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return 'pending';
      }
      
      return receipt.status === 1 ? 'confirmed' : 'failed';
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      return 'failed';
    }
  }
}

/**
 * Hook pour utiliser le service de trading non-custodial
 */
export function useNonCustodialTrading(
  provider: ethers.BrowserProvider | null,
  signer: ethers.JsonRpcSigner | null,
  tradingContractAddress: string,
  chzTokenAddress: string
) {
  if (!provider || !signer) {
    return null;
  }

  return new NonCustodialTradingService(
    provider,
    signer,
    tradingContractAddress,
    chzTokenAddress
  );
}
