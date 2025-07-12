import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  FAN_TOKEN_METADATA,
  SUPPORTED_CHAINS,
} from "../config/contracts";
import { useERC20Read } from "../hooks/useContracts";
import { useOnChainTokenBalances } from "../hooks/useOnChainTokenBalances";

interface FanTokenPortfolioProps {
  onTokenPress?: (tokenAddress: string) => void;
}

export default function FanTokenPortfolio({
  onTokenPress,
}: FanTokenPortfolioProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { tokens, loading, error, refetch } = useOnChainTokenBalances();

  // Check if we're on a supported Chiliz network
  const isChilizNetwork =
    chainId === SUPPORTED_CHAINS.CHILIZ_SPICY_TESTNET ||
    chainId === SUPPORTED_CHAINS.CHILIZ_MAINNET;

  // Get CHZ balance
  const { data: chzBalanceData } = useERC20Read(
    CONTRACT_ADDRESSES.CHZ_TOKEN,
    "balanceOf",
    [address],
    { enabled: !!address && isConnected }
  );

  const chzBalance = chzBalanceData as bigint | undefined;

  // Filter tokens with non-zero balance
  const portfolioTokens = tokens.filter((token) => token.readableBalance > 0);

  const calculatePortfolioValue = () => {
    return portfolioTokens.reduce((total: number, token) => {
      // For now, just sum the token balances (you can add CHZ value calculation later)
      return total + token.readableBalance;
    }, 0);
  };

  const getTokenMetadata = (symbol: string) => {
    return FAN_TOKEN_METADATA.find((meta) => meta.symbol === symbol);
  };

  const renderPortfolioItem = ({
    item: token,
  }: {
    item: (typeof tokens)[0];
  }) => {
    const metadata = getTokenMetadata(token.symbol);

    return (
      <TouchableOpacity
        style={styles.portfolioItem}
        onPress={() => onTokenPress?.(token.contractAddress)}
      >
        <View style={styles.tokenHeader}>
          <View
            style={[
              styles.tokenIcon,
              { backgroundColor: metadata?.color || "#333" },
            ]}
          >
            <Text style={styles.tokenEmoji}>{metadata?.emoji || "⚽"}</Text>
          </View>
          <View style={styles.tokenInfo}>
            <Text style={styles.tokenSymbol}>{token.symbol}</Text>
            <Text style={styles.tokenName}>
              {metadata?.name || "Fan Token"}
            </Text>
          </View>
        </View>

        <View style={styles.tokenValues}>
          <Text style={styles.balance}>
            {token.readableBalance.toFixed(2)} {token.symbol}
          </Text>
          <Text style={styles.contractAddress}>
            {token.contractAddress.slice(0, 8)}...
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Please connect your wallet to view your portfolio
          </Text>
        </View>
      </View>
    );
  }

  if (!isChilizNetwork) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Connect to Chiliz network to see your portfolio
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
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with total value */}
      <View style={styles.header}>
        <Text style={styles.title}>My Portfolio</Text>
        <View style={styles.portfolioSummary}>
          {chzBalance && (
            <Text style={styles.chzBalance}>
              CHZ: {Number(formatEther(chzBalance)).toFixed(4)}
            </Text>
          )}
          <Text style={styles.portfolioValue}>
            Fan Tokens: {calculatePortfolioValue().toFixed(2)} tokens
          </Text>
        </View>
      </View>

      {/* Portfolio list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading portfolio...</Text>
        </View>
      ) : portfolioTokens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No fan tokens in your portfolio</Text>
          <Text style={styles.emptySubtext}>
            Start by buying fan tokens to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={portfolioTokens}
          renderItem={renderPortfolioItem}
          keyExtractor={(item) => item.contractAddress}
          style={styles.portfolioList}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  portfolioSummary: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chzBalance: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066CC",
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  portfolioList: {
    flex: 1,
  },
  portfolioItem: {
    backgroundColor: "#FFF",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tokenIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tokenEmoji: {
    fontSize: 24,
    textAlign: "center",
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
    fontWeight: "bold",
    color: "#333",
  },
  tokenName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  teamInfo: {
    fontSize: 12,
    color: "#999",
  },
  tokenValues: {
    alignItems: "flex-end",
  },
  balance: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#0066CC",
    fontWeight: "500",
    marginTop: 2,
  },
  price: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  contractAddress: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: "#0066CC",
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
