import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAccount, useChainId } from 'wagmi';
import { ethers } from 'ethers';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import TransactionSigningModal from './TransactionSigningModal';
import { 
  TradeTransaction,
  useNonCustodialTrading 
} from '../services/NonCustodialTradingService';
import { getContractAddresses } from '../contracts/chilizConfig';

// Configuration des tokens fan disponibles
const FAN_TOKENS = [
  { symbol: 'PSG', name: 'Paris Saint-Germain', color: '#004170', emoji: '⚽' },
  { symbol: 'RMA', name: 'Real Madrid', color: '#FEBE10', emoji: '👑' },
  { symbol: 'BAR', name: 'Barcelona', color: '#A50044', emoji: '🔵' },
  { symbol: 'CITY', name: 'Manchester City', color: '#6CABDD', emoji: '💙' },
  { symbol: 'JUV', name: 'Juventus', color: '#000000', emoji: '⚪' },
  { symbol: 'BAY', name: 'Bayern Munich', color: '#DC052D', emoji: '🔴' },
];

interface EnhancedFanTokenTradingProps {
  onTradeComplete?: (txHash: string) => void;
}

export default function EnhancedFanTokenTrading({ onTradeComplete }: EnhancedFanTokenTradingProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  
  const [selectedToken, setSelectedToken] = useState<string>('PSG');
  const [amount, setAmount] = useState<string>('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  
  // Modal states
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [preparedTransaction, setPreparedTransaction] = useState<TradeTransaction | null>(null);
  const [isSigningTransaction, setIsSigningTransaction] = useState(false);

  // Initialiser le provider et signer
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum && isConnected) {
        try {
          const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
          const signerInstance = await browserProvider.getSigner();
          setProvider(browserProvider);
          setSigner(signerInstance);
        } catch (error) {
          console.error('Erreur lors de l\'initialisation du provider:', error);
        }
      }
    };

    initProvider();
  }, [isConnected]);

  // Obtenir le service de trading
  const contracts = getContractAddresses(chainId);
  const tradingService = useNonCustodialTrading(
    provider,
    signer,
    contracts?.FAN_TOKEN_TRADING || '',
    contracts?.CHZ_TOKEN || ''
  );

  // Fonction pour préparer une transaction
  const handlePrepareTransaction = async () => {
    if (!tradingService || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    try {
      setIsLoading(true);
      
      // Pour cet exemple, nous utilisons des adresses fictives
      // Dans un vrai projet, vous récupéreriez ces adresses depuis votre configuration
      const tokenAddress = `0x${selectedToken.toLowerCase()}token`; // Adresse fictive
      
      let transaction: TradeTransaction;
      
      if (tradeType === 'buy') {
        transaction = await tradingService.prepareBuyTransaction(
          tokenAddress,
          selectedToken,
          amount
        );
      } else {
        transaction = await tradingService.prepareSellTransaction(
          tokenAddress,
          selectedToken,
          amount
        );
      }
      
      setPreparedTransaction(transaction);
      setShowSigningModal(true);
    } catch (error) {
      console.error('Erreur lors de la préparation:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour signer et envoyer la transaction
  const handleSignTransaction = async () => {
    if (!tradingService || !preparedTransaction) return;

    try {
      setIsSigningTransaction(true);
      
      const txHash = await tradingService.signAndBroadcastTransaction(preparedTransaction);
      
      // Fermer le modal
      setShowSigningModal(false);
      setPreparedTransaction(null);
      
      // Réinitialiser le formulaire
      setAmount('');
      
      // Notification de succès
      Alert.alert(
        '✅ Transaction réussie',
        `Transaction confirmée: ${txHash}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onTradeComplete) {
                onTradeComplete(txHash);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur de transaction');
    } finally {
      setIsSigningTransaction(false);
    }
  };

  const renderTokenItem = ({ item }: { item: typeof FAN_TOKENS[0] }) => (
    <TouchableOpacity
      style={[
        styles.tokenItem,
        { borderColor: item.color },
        selectedToken === item.symbol && { backgroundColor: `${item.color}20` }
      ]}
      onPress={() => setSelectedToken(item.symbol)}
    >
      <ThemedText style={styles.tokenEmoji}>{item.emoji}</ThemedText>
      <ThemedView style={styles.tokenInfo}>
        <ThemedText style={styles.tokenSymbol}>{item.symbol}</ThemedText>
        <ThemedText style={styles.tokenName}>{item.name}</ThemedText>
      </ThemedView>
      {selectedToken === item.symbol && (
        <ThemedText style={styles.selectedIndicator}>✓</ThemedText>
      )}
    </TouchableOpacity>
  );

  if (!isConnected) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.notConnectedContainer}>
          <ThemedText style={styles.notConnectedTitle}>
            🔐 Wallet non connecté
          </ThemedText>
          <ThemedText style={styles.notConnectedText}>
            Connectez votre wallet pour commencer à trader des fan tokens
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>🚀 Trading Non-Custodial</ThemedText>
        <ThemedText style={styles.subtitle}>
          Signez vos transactions en toute sécurité
        </ThemedText>
      </ThemedView>

      {/* Sélection du type de trade */}
      <ThemedView style={styles.tradeTypeContainer}>
        <TouchableOpacity
          style={[styles.tradeTypeButton, tradeType === 'buy' && styles.tradeTypeButtonActive]}
          onPress={() => setTradeType('buy')}
        >
          <ThemedText style={[
            styles.tradeTypeText,
            tradeType === 'buy' && styles.tradeTypeTextActive
          ]}>
            📈 ACHETER
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tradeTypeButton, tradeType === 'sell' && styles.tradeTypeButtonActive]}
          onPress={() => setTradeType('sell')}
        >
          <ThemedText style={[
            styles.tradeTypeText,
            tradeType === 'sell' && styles.tradeTypeTextActive
          ]}>
            📉 VENDRE
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Sélection du token */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          ⚽ Sélectionnez un Fan Token
        </ThemedText>
        <FlatList
          data={FAN_TOKENS}
          renderItem={renderTokenItem}
          keyExtractor={(item) => item.symbol}
          style={styles.tokenList}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>

      {/* Input montant */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          💰 Montant ({tradeType === 'buy' ? 'CHZ' : selectedToken})
        </ThemedText>
        <TextInput
          style={styles.amountInput}
          placeholder={`Entrez le montant en ${tradeType === 'buy' ? 'CHZ' : selectedToken}`}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </ThemedView>

      {/* Bouton de trading */}
      <TouchableOpacity
        style={[styles.tradeButton, { opacity: isLoading ? 0.7 : 1 }]}
        onPress={handlePrepareTransaction}
        disabled={isLoading || !amount}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <ThemedText style={styles.tradeButtonText}>
            🔐 Préparer la transaction
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* Informations de sécurité */}
      <ThemedView style={styles.securityInfo}>
        <ThemedText style={styles.securityTitle}>🛡️ Sécurité garantie</ThemedText>
        <ThemedText style={styles.securityText}>
          • Vous gardez le contrôle total de vos clés{'\n'}
          • Chaque transaction doit être signée par vous{'\n'}
          • Aucune donnée sensible n&apos;est stockée{'\n'}
          • Code source vérifiable sur blockchain
        </ThemedText>
      </ThemedView>

      {/* Modal de signature */}
      <TransactionSigningModal
        isVisible={showSigningModal}
        onClose={() => {
          setShowSigningModal(false);
          setPreparedTransaction(null);
        }}
        transactionData={preparedTransaction ? {
          type: preparedTransaction.type,
          tokenSymbol: preparedTransaction.tokenSymbol,
          amount: preparedTransaction.amount,
          estimatedPrice: preparedTransaction.estimatedChzAmount,
          gasEstimate: preparedTransaction.estimatedGas,
        } : null}
        onSign={handleSignTransaction}
        isLoading={isSigningTransaction}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  tradeTypeContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tradeTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tradeTypeButtonActive: {
    backgroundColor: '#6366F1',
  },
  tradeTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tradeTypeTextActive: {
    color: '#FFF',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  tokenList: {
    maxHeight: 200,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  tokenEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tokenName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  selectedIndicator: {
    fontSize: 20,
    color: '#10B981',
  },
  amountInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFF',
  },
  tradeButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  tradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  securityInfo: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notConnectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  notConnectedText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
