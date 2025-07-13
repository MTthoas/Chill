import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { useAccount } from "wagmi";
import { getTeamMetadata } from "../../contracts/chilizConfig";
import { useChilizTrading } from "../../hooks/useChilizTrading";
import {
  FAN_TOKEN_ADDRESSES,
  getTokenMetadata,
  useFanTokenBalances,
} from "../../hooks/useFanTokenBalance";

const { width } = Dimensions.get("window");

// Helper pour formater les gros nombres
function formatLargeNumber(num: number): string {
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toFixed(2);
}

// Hook pour récupérer les prix en temps réel (CoinGecko)
function useTokenPrices(symbols: string[]) {
  const [prices, setPrices] = useState<{ [symbol: string]: number }>({});
  useEffect(() => {
    if (!symbols.length) return;
    async function fetchPrices() {
      try {
        // Mapping symbol -> id CoinGecko
        const coingeckoIds: { [symbol: string]: string } = {
          CHZ: "chiliz",
          PSG: "paris-saint-germain-fan-token",
          CITY: "manchester-city-fan-token",
          BAR: "fc-barcelona-fan-token",
          JUV: "juventus-fan-token",
          ACM: "ac-milan-fan-token",
          AFC: "arsenal-fan-token",
        };
        const ids = symbols
          .map((s) => coingeckoIds[s])
          .filter(Boolean)
          .join(",");
        if (!ids) return;
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        );
        const data = await res.json();
        const result: { [symbol: string]: number } = {};
        for (const symbol of symbols) {
          const id = coingeckoIds[symbol];
          if (id && data[id] && data[id].usd) {
            result[symbol] = data[id].usd;
          }
        }
        setPrices(result);
      } catch (e) {
        console.error("[TokenPrices] Error fetching prices:", e);
        setPrices({});
      }
    }
    fetchPrices();
  }, [symbols]);
  return prices;
}

// Helper pour logo fan token (comme dans index.tsx)
function getFanTokenLogo(symbol: string) {
  switch (symbol) {
    case "PSG":
      return "https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Paris_Saint-Germain_Logo.svg/1200px-Paris_Saint-Germain_Logo.svg.png";
    case "CITY":
      return "https://upload.wikimedia.org/wikipedia/fr/thumb/b/ba/Logo_Manchester_City_2016.svg/langfr-250px-Logo_Manchester_City_2016.svg.png";
    case "BAR":
      return "https://upload.wikimedia.org/wikipedia/fr/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png";
    case "JUV":
      return "https://upload.wikimedia.org/wikipedia/fr/thumb/d/da/Juventus_Logo.svg/1200px-Juventus_Logo.svg.png";
    case "ACM":
      return "https://upload.wikimedia.org/wikipedia/fr/thumb/8/ac/Milan_AC.svg/1200px-Milan_AC.svg.png";
    case "AFC":
      return "https://upload.wikimedia.org/wikipedia/fr/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png";
    default:
      return "https://cdn-icons-png.flaticon.com/512/197/197564.png";
  }
}

export default function Trading() {
  const { isConnected } = useAccount();
  const {
    isChilizNetwork,
    chzBalance,
    refreshData,
    buyTokens,
    sellTokens,
    getBuyQuote,
    getSellQuote,
  } = useChilizTrading();

  const { tokens: fanTokenBalances } = useFanTokenBalances();

  const [selectedToken, setSelectedToken] = useState<string>("");
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [quote, setQuote] = useState<string>("");
  const [isTrading, setIsTrading] = useState(false);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);

  // Créer une liste de tous les tokens disponibles avec métadonnées
  const allAvailableTokens = FAN_TOKEN_ADDRESSES.map((address) => {
    const existingToken = fanTokenBalances.find(
      (t) => t.contractAddress === address
    );
    if (existingToken) {
      return existingToken;
    }
    // Pour les tokens non détnus, créer un objet avec balance 0
    const metadata = getTokenMetadata(address);
    return {
      contractAddress: address,
      symbol: metadata.symbol,
      name: metadata.name,
      decimals: 18,
      readableBalance: 0,
      rawBalance: 0,
    };
  });

  // Filtrer les tokens selon le type de trade
  const availableTokensForTrade =
    tradeType === "buy"
      ? allAvailableTokens // Tous les tokens pour acheter
      : fanTokenBalances.filter((token) => token.readableBalance > 0); // Seulement ceux détenus pour vendre

  // Transformer les données pour react-native-element-dropdown
  const dropdownData = availableTokensForTrade.map((token) => ({
    label: token.symbol,
    value: token.contractAddress,
    symbol: token.symbol,
    name: getTeamMetadata(token.symbol)?.name || token.name,
    balance: token.readableBalance?.toFixed(2) || "0.00",
    logoUri: getFanTokenLogo(token.symbol),
  }));

  // Reset selection when switching trade type if token not available
  useEffect(() => {
    if (
      selectedToken &&
      !availableTokensForTrade.find((t) => t.contractAddress === selectedToken)
    ) {
      setSelectedToken("");
      setQuote("");
    }
  }, [tradeType, selectedToken, availableTokensForTrade]);

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

  // Calculer le quote automatiquement
  useEffect(() => {
    const calculateQuote = async () => {
      if (!selectedToken || !tradeAmount || parseFloat(tradeAmount) <= 0) {
        setQuote("");
        return;
      }

      try {
        setIsCalculatingQuote(true);
        const quoteResult =
          tradeType === "buy"
            ? await getBuyQuote(selectedToken, tradeAmount)
            : await getSellQuote(selectedToken, tradeAmount);
        setQuote(quoteResult);
      } catch (err) {
        console.error("Erreur lors du calcul du quote:", err);
        setQuote("");
      } finally {
        setIsCalculatingQuote(false);
      }
    };

    const debounceTimer = setTimeout(calculateQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [selectedToken, tradeAmount, tradeType, getBuyQuote, getSellQuote]);

  const handleTrade = async () => {
    if (!selectedToken || !tradeAmount || parseFloat(tradeAmount) <= 0) {
      Alert.alert(
        "Erreur",
        "Veuillez sélectionner un token et entrer un montant valide"
      );
      return;
    }

    try {
      setIsTrading(true);

      const result =
        tradeType === "buy"
          ? await buyTokens(selectedToken, tradeAmount)
          : await sellTokens(selectedToken, tradeAmount);

      Alert.alert(
        "Transaction réussie",
        `${tradeType === "buy" ? "Achat" : "Vente"} de ${
          result.tokenAmount
        } tokens pour ${result.chzAmount} CHZ`
      );

      // Reset form et refresh data
      setTradeAmount("");
      setQuote("");
      await refreshData();
    } catch (err) {
      console.error("Erreur lors du trade:", err);
      Alert.alert(
        "Erreur",
        err instanceof Error ? err.message : "Erreur lors de la transaction"
      );
    } finally {
      setIsTrading(false);
    }
  };

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

          {/* Token Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>🏆 Sélectionner un Token</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              iconStyle={styles.iconStyle}
              data={dropdownData}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={
                tradeType === "buy"
                  ? "Choisir un token à acheter..."
                  : "Choisir un token à vendre..."
              }
              value={selectedToken}
              onChange={(item) => {
                setSelectedToken(item.value);
              }}
              renderLeftIcon={() =>
                selectedToken ? (
                  <Image
                    source={{
                      uri: dropdownData.find(
                        (item) => item.value === selectedToken
                      )?.logoUri,
                    }}
                    style={styles.dropdownIcon}
                    resizeMode="contain"
                  />
                ) : null
              }
              renderItem={(item) => (
                <View style={styles.dropdownItem}>
                  <Image
                    source={{ uri: item.logoUri }}
                    style={styles.dropdownItemImage}
                    resizeMode="contain"
                  />
                  <View style={styles.dropdownItemInfo}>
                    <Text style={styles.dropdownItemSymbol}>{item.symbol}</Text>
                    <Text style={styles.dropdownItemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.dropdownItemBalance}>{item.balance}</Text>
                </View>
              )}
            />
          </View>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              💰 Montant ({tradeType === "buy" ? "CHZ" : "Tokens"})
            </Text>
            <TextInput
              style={styles.amountInput}
              value={tradeAmount}
              onChangeText={setTradeAmount}
              placeholder="0.00"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          {/* Quote Display */}
          {quote && (
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteLabel}>
                {tradeType === "buy" ? "🎯 Vous recevrez" : "💵 Vous recevrez"}
              </Text>
              <Text style={styles.quoteValue}>
                {isCalculatingQuote
                  ? "Calcul..."
                  : `${quote} ${tradeType === "buy" ? "Tokens" : "CHZ"}`}
              </Text>
            </View>
          )}

          {/* Trade Button */}
          <TouchableOpacity
            style={[
              styles.tradeButton,
              (!selectedToken || !tradeAmount || isTrading) &&
                styles.tradeButtonDisabled,
            ]}
            onPress={handleTrade}
            disabled={!selectedToken || !tradeAmount || isTrading}
          >
            {isTrading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.tradeButtonText}>
                {tradeType === "buy" ? "🚀 Acheter" : "💎 Vendre"}
              </Text>
            )}
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
    backgroundColor: "#0d0e12",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flex: 1,
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
    fontWeight: "500",
  },
  // OKX Header Styles
  okxHeader: {
    backgroundColor: "#0d0e12",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  okxTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  okxSubtitle: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  // Stats Section
  statsContainer: {
    padding: 16,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#23262f",
    borderRadius: 16,
    padding: 16,
    width: (width - 48) / 2,
    borderWidth: 1.5,
    borderColor: "#363a45",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "#0f1f0f",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  // AI Section
  aiSection: {
    backgroundColor: "#1a0b2e",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#6366f1",
  },
  aiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  aiTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  aiBadge: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  aiDescription: {
    color: "#c7d2fe",
    fontSize: 14,
    fontWeight: "500",
  },
  // Trading Section
  tradingSection: {
    backgroundColor: "#101214",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2c2f36",
  },
  tradingHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tradeTypeContainer: {
    flexDirection: "row",
    backgroundColor: "#23262f",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tradeTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  tradeTypeButtonActive: {
    backgroundColor: "#6366f1",
  },
  tradeTypeText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  tradeTypeTextActive: {
    color: "#fff",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: "#23262f",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#363a45",
  },
  quoteContainer: {
    backgroundColor: "#0f1f0f",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  quoteLabel: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  quoteValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  tradeButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tradeButtonDisabled: {
    backgroundColor: "#444",
    shadowColor: "transparent",
  },
  tradeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Tokens Section
  tokensSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  loader: {
    marginTop: 20,
  },
  tokenCard: {
    backgroundColor: "#23262f",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#363a45",
  },
  selectedTokenCard: {
    borderColor: "#6366f1",
    backgroundColor: "#1a1b2e",
  },
  tokenCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#191b22",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tokenEmoji: {
    fontSize: 24,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  tokenName: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  tokenCardRight: {
    alignItems: "flex-end",
  },
  tokenBalance: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  tokenValue: {
    color: "#888",
    fontSize: 12,
    fontWeight: "500",
  },
  tokenBalanceLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "500",
  },
  // Balance Card
  balanceCard: {
    backgroundColor: "#0f1f0f",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#22c55e",
    alignItems: "center",
  },
  balanceTitle: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  balanceValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  // React Native Element Dropdown Styles
  dropdown: {
    backgroundColor: "#23262f",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#363a45",
  },
  placeholderStyle: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  selectedTextStyle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dropdownIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#23262f",
  },
  dropdownItemImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#fff",
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemSymbol: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  dropdownItemName: {
    color: "#888",
    fontSize: 12,
    fontWeight: "500",
  },
  dropdownItemBalance: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "600",
  },
});
