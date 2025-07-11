import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { useChilizTrading } from '../hooks/useChilizTrading';
import { getTeamMetadata } from '../contracts/chilizConfig';

interface FanTokenTradingProps {
  onTradeComplete?: (result: any) => void;
}

export default function FanTokenTrading({ onTradeComplete }: FanTokenTradingProps) {
  const {
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
  } = useChilizTrading();

  const [selectedToken, setSelectedToken] = useState<string>('');
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quote, setQuote] = useState<string>('');
  const [isTrading, setIsTrading] = useState(false);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);

  // Calculer le quote automatiquement
  useEffect(() => {
    const calculateQuote = async () => {
      if (!selectedToken || !tradeAmount || parseFloat(tradeAmount) <= 0) {
        setQuote('');
        return;
      }

      try {
        setIsCalculatingQuote(true);
        const quoteResult = tradeType === 'buy' 
          ? await getBuyQuote(selectedToken, tradeAmount)
          : await getSellQuote(selectedToken, tradeAmount);
        setQuote(quoteResult);
      } catch (err) {
        console.error('Erreur lors du calcul du quote:', err);
        setQuote('');
      } finally {
        setIsCalculatingQuote(false);
      }
    };

    const debounceTimer = setTimeout(calculateQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [selectedToken, tradeAmount, tradeType, getBuyQuote, getSellQuote]);

  const handleTrade = async () => {
    if (!selectedToken || !tradeAmount || parseFloat(tradeAmount) <= 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner un token et entrer un montant valide');
      return;
    }

    try {
      setIsTrading(true);
      
      const result = tradeType === 'buy' 
        ? await buyTokens(selectedToken, tradeAmount)
        : await sellTokens(selectedToken, tradeAmount);

      Alert.alert(
        'Transaction réussie',
        `${tradeType === 'buy' ? 'Achat' : 'Vente'} de ${result.tokenAmount} tokens pour ${result.chzAmount} CHZ`
      );

      // Reset form
      setTradeAmount('');
      setQuote('');
      
      if (onTradeComplete) {
        onTradeComplete(result);
      }
    } catch (err) {
      console.error('Erreur lors du trade:', err);
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Erreur lors de la transaction');
    } finally {
      setIsTrading(false);
    }
  };

  const renderTokenItem = ({ item: tokenAddress }: { item: string }) => {
    const tokenInfo = fanTokensInfo[tokenAddress];
    const balance = userBalances[tokenAddress];
    const metadata = getTeamMetadata(tokenInfo?.symbol || '');

    if (!tokenInfo) return null;

    return (
      <TouchableOpacity
        style={[
          styles.tokenItem,
          selectedToken === tokenAddress && styles.selectedTokenItem
        ]}
        onPress={() => setSelectedToken(tokenAddress)}
      >
        <View style={styles.tokenHeader}>
          {metadata?.logo && (
            <Image 
              source={{ uri: metadata.logo }} 
              style={styles.tokenLogo}
              resizeMode="contain"
            />
          )}
          <View style={styles.tokenInfo}>
            <Text style={styles.tokenSymbol}>{tokenInfo.symbol}</Text>
            <Text style={styles.tokenName}>{tokenInfo.name}</Text>
            {metadata && (
              <Text style={styles.teamInfo}>{metadata.name} - {metadata.league}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.tokenDetails}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Achat: {(Number(tokenInfo.buyPrice) / 1e18).toFixed(4)} CHZ</Text>
            <Text style={styles.priceLabel}>Vente: {(Number(tokenInfo.sellPrice) / 1e18).toFixed(4)} CHZ</Text>
          </View>
          
          {balance && (
            <Text style={styles.balance}>
              Solde: {parseFloat(balance.formattedBalance).toFixed(2)} {tokenInfo.symbol}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!isChilizNetwork) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Veuillez vous connecter au réseau Chiliz pour utiliser cette fonctionnalité
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec solde CHZ */}
      <View style={styles.header}>
        <Text style={styles.title}>Trading Fan Tokens</Text>
        {chzBalance && (
          <Text style={styles.chzBalance}>
            CHZ: {parseFloat(chzBalance.formattedBalance).toFixed(2)}
          </Text>
        )}
      </View>

      {/* Sélecteur de type de trade */}
      <View style={styles.tradeTypeSelector}>
        <TouchableOpacity
          style={[styles.tradeTypeButton, tradeType === 'buy' && styles.selectedTradeType]}
          onPress={() => setTradeType('buy')}
        >
          <Text style={[styles.tradeTypeText, tradeType === 'buy' && styles.selectedTradeTypeText]}>
            Acheter
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tradeTypeButton, tradeType === 'sell' && styles.selectedTradeType]}
          onPress={() => setTradeType('sell')}
        >
          <Text style={[styles.tradeTypeText, tradeType === 'sell' && styles.selectedTradeTypeText]}>
            Vendre
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des tokens */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Chargement des fan tokens...</Text>
        </View>
      ) : (
        <FlatList
          data={supportedTokens}
          renderItem={renderTokenItem}
          keyExtractor={(item) => item}
          style={styles.tokenList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Formulaire de trade */}
      {selectedToken && (
        <View style={styles.tradeForm}>
          <Text style={styles.selectedTokenText}>
            Token sélectionné: {fanTokensInfo[selectedToken]?.symbol}
          </Text>
          
          <TextInput
            style={styles.amountInput}
            placeholder="Montant"
            value={tradeAmount}
            onChangeText={setTradeAmount}
            keyboardType="numeric"
          />

          {isCalculatingQuote && (
            <ActivityIndicator size="small" color="#0066CC" />
          )}

          {quote && (
            <Text style={styles.quote}>
              {tradeType === 'buy' ? 'Coût total' : 'Vous recevrez'}: {parseFloat(quote).toFixed(4)} CHZ
            </Text>
          )}

          <TouchableOpacity
            style={[styles.tradeButton, isTrading && styles.disabledButton]}
            onPress={handleTrade}
            disabled={isTrading || !quote}
          >
            {isTrading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.tradeButtonText}>
                {tradeType === 'buy' ? 'Acheter' : 'Vendre'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  chzBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  tradeTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tradeTypeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
  },
  selectedTradeType: {
    backgroundColor: '#0066CC',
  },
  tradeTypeText: {
    fontWeight: '600',
    color: '#333',
  },
  selectedTradeTypeText: {
    color: '#FFF',
  },
  tokenList: {
    flex: 1,
    marginBottom: 20,
  },
  tokenItem: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedTokenItem: {
    borderColor: '#0066CC',
    borderWidth: 2,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenName: {
    fontSize: 14,
    color: '#666',
  },
  teamInfo: {
    fontSize: 12,
    color: '#999',
  },
  tokenDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  balance: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '600',
  },
  tradeForm: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedTokenText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  quote: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  tradeButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  tradeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
