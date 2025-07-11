import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useChilizTrading } from '../hooks/useChilizTrading';
import { getTeamMetadata } from '../contracts/chilizConfig';

interface FanTokenPortfolioProps {
  onTokenPress?: (tokenAddress: string) => void;
}

export default function FanTokenPortfolio({ onTokenPress }: FanTokenPortfolioProps) {
  const {
    isLoading,
    error,
    isChilizNetwork,
    supportedTokens,
    fanTokensInfo,
    userBalances,
    chzBalance,
    refreshData,
  } = useChilizTrading();

  const portfolioTokens = supportedTokens.filter(tokenAddress => {
    const balance = userBalances[tokenAddress];
    return balance && parseFloat(balance.formattedBalance) > 0;
  });

  const calculatePortfolioValue = () => {
    return portfolioTokens.reduce((total, tokenAddress) => {
      const balance = userBalances[tokenAddress];
      const tokenInfo = fanTokensInfo[tokenAddress];
      
      if (balance && tokenInfo) {
        const tokenValue = parseFloat(balance.formattedBalance) * (Number(tokenInfo.sellPrice) / 1e18);
        return total + tokenValue;
      }
      return total;
    }, 0);
  };

  const renderPortfolioItem = ({ item: tokenAddress }: { item: string }) => {
    const tokenInfo = fanTokensInfo[tokenAddress];
    const balance = userBalances[tokenAddress];
    const metadata = getTeamMetadata(tokenInfo?.symbol || '');

    if (!tokenInfo || !balance) return null;

    const tokenValue = parseFloat(balance.formattedBalance) * (Number(tokenInfo.sellPrice) / 1e18);
    const balanceAmount = parseFloat(balance.formattedBalance);

    return (
      <TouchableOpacity
        style={styles.portfolioItem}
        onPress={() => onTokenPress?.(tokenAddress)}
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
              <Text style={styles.teamInfo}>{metadata.name}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.tokenValues}>
          <Text style={styles.balance}>
            {balanceAmount.toFixed(2)} {tokenInfo.symbol}
          </Text>
          <Text style={styles.value}>
            ≈ {tokenValue.toFixed(4)} CHZ
          </Text>
          <Text style={styles.price}>
            @ {(Number(tokenInfo.sellPrice) / 1e18).toFixed(4)} CHZ
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isChilizNetwork) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Connectez-vous au réseau Chiliz pour voir votre portfolio
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
      {/* Header avec valeur totale */}
      <View style={styles.header}>
        <Text style={styles.title}>Mon Portfolio</Text>
        <View style={styles.portfolioSummary}>
          {chzBalance && (
            <Text style={styles.chzBalance}>
              CHZ: {parseFloat(chzBalance.formattedBalance).toFixed(2)}
            </Text>
          )}
          <Text style={styles.portfolioValue}>
            Valeur Fan Tokens: {calculatePortfolioValue().toFixed(4)} CHZ
          </Text>
        </View>
      </View>

      {/* Liste du portfolio */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Chargement du portfolio...</Text>
        </View>
      ) : portfolioTokens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun fan token dans votre portfolio</Text>
          <Text style={styles.emptySubtext}>
            Commencez par acheter des fan tokens pour les voir apparaître ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={portfolioTokens}
          renderItem={renderPortfolioItem}
          keyExtractor={(item) => item}
          style={styles.portfolioList}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refreshData}
        />
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  portfolioSummary: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chzBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  portfolioList: {
    flex: 1,
  },
  portfolioItem: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenLogo: {
    width: 50,
    height: 50,
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
    marginBottom: 2,
  },
  teamInfo: {
    fontSize: 12,
    color: '#999',
  },
  tokenValues: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    marginTop: 2,
  },
  price: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
