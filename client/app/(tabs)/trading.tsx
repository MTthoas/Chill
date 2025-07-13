import React, { useState } from "react";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAccount } from "wagmi";
import { useChilizTrading } from "../../hooks/useChilizTrading";
import { useFanTokenBalances } from "../../hooks/useFanTokenBalance";
import { useTokenPrices } from "../../hooks/useTokenPrices";

// Helper pour formater les gros nombres
function formatLargeNumber(num: number): string {
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toFixed(2);
}

export default function Trading() {
  const { isConnected } = useAccount();
  const { isChilizNetwork, chzBalance } = useChilizTrading();
  const { tokens: fanTokenBalances } = useFanTokenBalances();

  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");

  // Récupérer les prix des tokens
  const allSymbols = ["CHZ", ...fanTokenBalances.map((t) => t.symbol)];
  const prices = useTokenPrices(allSymbols);

  // Calcul du volume total et des stats réelles
  const totalVolume = fanTokenBalances.reduce(
    (total, token) =>
      total + Number(token.readableBalance) * (prices[token.symbol] || 0),
    0
  );

  // Stats dynamiques basées sur les vraies données
  const tradingStats = [
    {
      icon: "💰",
      value: `$${formatLargeNumber(totalVolume)}`,
      label: "Your Portfolio",
      trend: chzBalance
        ? `${parseFloat(chzBalance.formattedBalance).toFixed(2)} CHZ`
        : "0 CHZ",
    },
    {
      icon: "⚽",
      value: fanTokenBalances.length.toString(),
      label: "Fan Tokens",
      trend:
        fanTokenBalances.filter((t) => t.readableBalance > 0).length > 0
          ? "Owned"
          : "None",
    },
    {
      icon: "📈",
      value: isChilizNetwork ? "Connected" : "Switch",
      label: "Network",
      trend: isChilizNetwork ? "Chiliz" : "Wrong",
    },
    {
      icon: "⚡",
      value: "Live",
      label: "Market",
      trend: "Active",
    },
  ];

  const renderStatCard = (stat: any, index: number) => (
    <View key={index} style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{stat.icon}</Text>
        <Text style={styles.statTrend}>{stat.trend}</Text>
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.connectMessage}>
            💼 Connectez votre wallet pour trader
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isChilizNetwork) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.connectMessage}>
            🔗 Veuillez vous connecter au réseau Chiliz
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* OKX-style Header */}
        <View style={styles.okxHeader}>
          <Text style={styles.okxTitle}>Fan Token Trading</Text>
          <Text style={styles.okxSubtitle}>Trade your favorite teams</Text>
        </View>

        {/* Stats Section - Premium OKX style */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            {tradingStats.map((stat, index) => renderStatCard(stat, index))}
          </View>
        </View>

        {/* AI Trading Section - Violet highlight */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiTitle}>🤖 AI Trading Assistant</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>PREMIUM</Text>
            </View>
          </View>
          <Text style={styles.aiDescription}>
            Analyses intelligentes du marché en temps réel
          </Text>
        </View>

        {/* Trading Interface */}
        <View style={styles.tradingSection}>
          <View style={styles.tradingHeader}>
            <Text style={styles.sectionTitle}>⚡ Trading Interface</Text>
          </View>

          {/* Trade Type Selector */}
          <View style={styles.tradeTypeContainer}>
            <TouchableOpacity
              style={[
                styles.tradeTypeButton,
                tradeType === "buy" && styles.tradeTypeButtonActive,
              ]}
              onPress={() => setTradeType("buy")}
            >
              <Text
                style={[
                  styles.tradeTypeText,
                  tradeType === "buy" && styles.tradeTypeTextActive,
                ]}
              >
                📈 Acheter
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tradeTypeButton,
                tradeType === "sell" && styles.tradeTypeButtonActive,
              ]}
              onPress={() => setTradeType("sell")}
            >
              <Text
                style={[
                  styles.tradeTypeText,
                  tradeType === "sell" && styles.tradeTypeTextActive,
                ]}
              >
                📉 Vendre
              </Text>
            </TouchableOpacity>
          </View>

          {/* Socios Redirect Button */}
          <TouchableOpacity
            style={styles.sociosButton}
            onPress={() => {
              const sociosUrl = "https://www.socios.com/";
              Linking.openURL(sociosUrl).catch((err) =>
                console.error("Failed to open Socios URL:", err)
              );
            }}
            activeOpacity={0.8}
          >
            <View style={styles.sociosButtonContent}>
              <Text style={styles.sociosButtonIcon}>⚽</Text>
              <Text style={styles.sociosButtonText}>
                {tradeType === "buy" ? "🛒 Buy on Socios" : "💰 Sell on Socios"}
              </Text>
              <Text style={styles.sociosButtonSubtext}>
                Trade fan tokens on the official platform
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* CHZ Balance Display */}
        {chzBalance && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>💰 Solde CHZ</Text>
            <Text style={styles.balanceValue}>
              {parseFloat(chzBalance.formattedBalance).toFixed(4)} CHZ
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  connectMessage: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "600",
  },
  // OKX-style Header
  okxHeader: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  okxTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  okxSubtitle: {
    color: "#8B8D98",
    fontSize: 16,
    fontWeight: "500",
  },
  // Stats Section
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#1A1B23",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2D3A",
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  statTrend: {
    color: "#00D084",
    fontSize: 12,
    fontWeight: "600",
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    color: "#8B8D98",
    fontSize: 12,
    fontWeight: "500",
  },
  // AI Section
  aiSection: {
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.3)",
  },
  aiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  aiTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  aiBadge: {
    backgroundColor: "#9333EA",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  aiDescription: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
  },
  // Trading Section
  tradingSection: {
    backgroundColor: "#1A1B23",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2A2D3A",
  },
  tradingHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  tradeTypeContainer: {
    flexDirection: "row",
    backgroundColor: "#0F1017",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tradeTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  tradeTypeButtonActive: {
    backgroundColor: "#1A1B23",
  },
  tradeTypeText: {
    color: "#8B8D98",
    fontSize: 16,
    fontWeight: "600",
  },
  tradeTypeTextActive: {
    color: "#fff",
  },
  // Socios Button
  sociosButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sociosButtonContent: {
    alignItems: "center",
  },
  sociosButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  sociosButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sociosButtonSubtext: {
    color: "#E2E8F0",
    fontSize: 14,
    textAlign: "center",
  },
  // Balance Card
  balanceCard: {
    backgroundColor: "#1A1B23",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2A2D3A",
    alignItems: "center",
  },
  balanceTitle: {
    color: "#8B8D98",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  balanceValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});
