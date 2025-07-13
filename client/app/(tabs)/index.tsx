import { AppKitButton } from "@reown/appkit-wagmi-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAccount, useBalance, useChainId } from "wagmi";

import { useFanTokenBalances } from "@/hooks/useFanTokenBalance";
import { useOnChainTokenBalances } from "@/hooks/useOnChainTokenBalances";

const { width, height } = Dimensions.get("window");

function formatLargeNumber(num: number): string {
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toFixed(2);
}

// Fonction pour obtenir le nom de la chaîne
const getChainName = (chainId: number): string => {
  switch (chainId) {
    case 88888:
      return "Chiliz Mainnet";
    case 88882:
      return "Chiliz Testnet";
    default:
      return `Chain ${chainId}`;
  }
};

// Hook pour récupérer les prix en temps réel (CoinGecko)
function useTokenPrices(symbols: string[]) {
  const [prices, setPrices] = useState<{ [symbol: string]: number }>({});
  useEffect(() => {
    if (!symbols.length) return;
    async function fetchPrices() {
      try {
        // Mapping symbol -> id CoinGecko (à compléter selon les tokens supportés)
        const coingeckoIds: { [symbol: string]: string } = {
          CHZ: "chiliz",
          PSG: "paris-saint-germain-fan-token",
          CITY: "manchester-city-fan-token",
          // Ajoute d'autres tokens ici si besoin
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
  });
  return prices;
}

export default function HomeScreen() {
  const { address } = useAccount();
  const chainId = useChainId();

  // Use on-chain token balances instead of backend API
  const { tokens, refetch } = useOnChainTokenBalances();

  const { tokens: fanTokens, loading: fanTokensLoading } =
    useFanTokenBalances();

  console.log("Fan Tokens:", fanTokens);

  const {
    data: chzBalance,
    isLoading: chzLoading,
    refetch: refetchChz,
  } = useBalance({
    address,
    chainId, // 88888 pour Chiliz Mainnet
  });

  console.log("Chiliz Balance:", chzBalance);
  const [refreshing, setRefreshing] = useState(false);
  const [hideSmallBalances, setHideSmallBalances] = useState(false);

  const allSymbols = ["CHZ", ...fanTokens.map((t) => t.symbol)];
  const prices = useTokenPrices(allSymbols);

  // Calcul dynamique de la valeur totale du portfolio en $
  const totalValue =
    (chzBalance ? Number(chzBalance.formatted) * (prices["CHZ"] || 0) : 0) +
    fanTokens.reduce(
      (total, token) =>
        total + Number(token.readableBalance) * (prices[token.symbol] || 0),
      0
    );

  // Fonction de refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    await refetchChz();
    setRefreshing(false);
  }, [refetch, refetchChz]);

  // Dashboard OKX-style betclicable
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dashboardContainer}>
        <ScrollView
          contentContainerStyle={styles.dashboardContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* OKX-style Header */}
          <View style={styles.okxHeader}>
            <View style={styles.okxHeaderTop}>
              <Text style={styles.okxWelcome}>⚽ TAKUMI PRO</Text>
              <TouchableOpacity style={styles.okxNotifButton}>
                <Text style={styles.okxNotifIcon}>🔔</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.okxWalletCard}>
              <View style={styles.okxWalletLeft}>
                <Text style={styles.okxChainLabel}>Connected to</Text>
                <Text style={styles.okxChainName}>{getChainName(chainId)}</Text>
              </View>
              <View style={styles.okxWalletRight}>
                <AppKitButton />
              </View>
            </View>
          </View>

          {/* OKX-style Balance Section */}
          <View style={styles.okxBalanceSection}>
            <View style={styles.okxBalanceHeader}>
              <Text style={styles.okxBalanceTitle}>Total Portfolio</Text>
              <TouchableOpacity style={styles.okxEyeButton}>
                <Text style={styles.okxEyeIcon}>👁️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.okxBalanceAmount}>
              ${formatLargeNumber(Number(totalValue.toFixed(2)))}
            </Text>
            <Text style={styles.okxBalanceSubtext}>
              {tokens.length} Fan Tokens • Live Market
            </Text>
          </View>

          {/* OKX-style Quick Stats */}
          <View style={styles.okxQuickStats}>
            {[
              {
                icon: "💰",
                value: `$${formatLargeNumber(Number(totalValue.toFixed(2)))}`,
                label: "Portfolio",
                trend: "+12.5%",
              },
              {
                icon: "⚽",
                value: tokens.length.toString(),
                label: "Tokens",
                trend: "+2",
              },
              { icon: "🏆", value: "6", label: "Top Clubs", trend: "New" },
              { icon: "📈", value: "Live", label: "Status", trend: "Active" },
            ].map((stat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.okxStatCard}
                activeOpacity={0.8}
              >
                <View style={styles.okxStatIcon}>
                  <Text style={styles.okxStatEmoji}>{stat.icon}</Text>
                </View>
                <Text style={styles.okxStatValue}>{stat.value}</Text>
                <Text style={styles.okxStatLabel}>{stat.label}</Text>
                <View style={styles.okxStatTrend}>
                  <Text style={styles.okxStatTrendText}>{stat.trend}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* OKX-style Tokens List */}
          <View style={styles.okxTokensSection}>
            <View style={styles.okxTokensHeader}>
              <Text style={styles.okxTokensTitle}>Holdings</Text>
              <TouchableOpacity
                style={styles.okxFilterBtn}
                onPress={() => setHideSmallBalances(!hideSmallBalances)}
                activeOpacity={0.7}
              >
                <Text style={styles.okxFilterIcon}>⚙️</Text>
                <Text style={styles.okxFilterText}>Filter</Text>
              </TouchableOpacity>
            </View>

            {fanTokensLoading || chzLoading ? (
              <View style={styles.okxLoadingState}>
                <ActivityIndicator size="large" color="#F7931A" />
                <Text style={styles.okxLoadingText}>Loading tokens...</Text>
              </View>
            ) : fanTokens.length > 0 || chzBalance ? (
              <View style={styles.okxTokensList}>
                {/* CHZ natif */}
                {chzBalance && (
                  <TouchableOpacity
                    style={styles.okxTokenItem}
                    activeOpacity={0.8}
                  >
                    <View style={styles.okxTokenLeft}>
                      <View style={styles.okxTokenIcon}>
                        <Image
                          source={{
                            uri: "https://s3.coinmarketcap.com/static-gravity/image/63c1513a40a6426a8a2f6ea63ce0a234.png",
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: "#fff",
                          }}
                        />
                      </View>
                      <View style={styles.okxTokenInfo}>
                        <Text style={styles.okxTokenSymbol}>CHZ</Text>
                        <Text style={styles.okxTokenName}>Chiliz</Text>
                      </View>
                    </View>
                    <View style={styles.okxTokenRight}>
                      <Text style={styles.okxTokenBalance}>
                        {Number(chzBalance.formatted).toFixed(4)}
                      </Text>
                      <Text style={styles.okxTokenAddress}>Native</Text>
                    </View>
                    <View style={styles.okxTokenArrow}>
                      <Text style={styles.okxArrowIcon}>›</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {/* Fan tokens dynamiques */}
                {fanTokens
                  .filter(
                    (token) => !hideSmallBalances || token.readableBalance > 0
                  )
                  .map((token, index) => (
                    <TouchableOpacity
                      key={`${token.contractAddress}-${index}`}
                      style={styles.okxTokenItem}
                      activeOpacity={0.8}
                    >
                      <View style={styles.okxTokenLeft}>
                        <View style={styles.okxTokenIcon}>
                          <Image
                            source={{ uri: getFanTokenLogo(token.symbol) }}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: "#fff",
                            }}
                          />
                        </View>
                        <View style={styles.okxTokenInfo}>
                          <Text style={styles.okxTokenSymbol}>
                            {token.symbol}
                          </Text>
                          <Text style={styles.okxTokenName}>{token.name}</Text>
                        </View>
                      </View>
                      <View style={styles.okxTokenRight}>
                        <Text style={styles.okxTokenBalance}>
                          {Number(token.readableBalance)}
                        </Text>
                        <Text style={styles.okxTokenAddress}>
                          {token.contractAddress.slice(0, 8)}...
                        </Text>
                      </View>
                      <View style={styles.okxTokenArrow}>
                        <Text style={styles.okxArrowIcon}>›</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : (
              <View style={styles.okxEmptyState}>
                <Text style={styles.okxEmptyIcon}>📭</Text>
                <Text style={styles.okxEmptyText}>No tokens found</Text>
                <TouchableOpacity
                  style={styles.okxRefreshBtn}
                  onPress={() => refetch()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.okxRefreshText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Helper pour logo fan token
function getFanTokenLogo(symbol: string) {
  switch (symbol) {
    case "PSG":
      return "https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Paris_Saint-Germain_Logo.svg/1200px-Paris_Saint-Germain_Logo.svg.png";
    case "CITY":
      return "https://upload.wikimedia.org/wikipedia/fr/thumb/b/ba/Logo_Manchester_City_2016.svg/langfr-250px-Logo_Manchester_City_2016.svg.png";
    // Ajoute d'autres logos si besoin
    default:
      return "https://cdn-icons-png.flaticon.com/512/197/197564.png";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Hero Section
  heroSection: {
    height: height * 0.6,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 80,
    backgroundColor: "transparent",
  },

  // Landing Page Styles
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "transparent",
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  logoText: {
    fontSize: 40,
    color: "#fff",
    textAlign: "center",
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 10,
    marginBottom: 30,
  },

  // Connect Button
  connectButton: {
    borderRadius: 30,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    minWidth: 280,
    alignItems: "center",
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  featureCardPremium: {
    width: 180,
    height: 140,
    marginRight: 18,
    borderRadius: 24,
    backgroundColor: "rgba(30,30,40,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  featuresScroll: {
    paddingLeft: 20,
    paddingVertical: 8,
  },
  featureIconPremium: {
    fontSize: 38,
    marginBottom: 10,
  },
  featureTitlePremium: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
    textAlign: "center",
  },
  featureDescPremium: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 18,
  },
  // Features Section
  featuresSection: {
    padding: 20,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 28,
    paddingTop: 10,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 18,
  },
  featureCard: {
    width: (width - 60) / 2,
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#181a20",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 2,
    borderColor: "#6366f1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
  },
  featureIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  featureDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
  },

  // Teams Section
  teamsSection: {
    paddingTop: 30,
    paddingBottom: 40,
    backgroundColor: "transparent",
  },
  teamsScrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingRight: 40,
  },
  teamCardWrapper: {
    marginRight: 16,
  },
  teamCard: {
    width: 140,
    height: 180,
    borderRadius: 20,
    position: "relative",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  teamCardGradient: {
    flex: 1,
    borderRadius: 20, // Ajouté pour garantir le rendu arrondi du gradient
  },
  teamCardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 2,
  },
  teamCardShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 1,
  },
  teamEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  teamSymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  teamName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 16,
  },

  // CTA Section
  ctaSection: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "transparent",
  },
  ctaCard: {
    padding: 30,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  ctaDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  secondaryButton: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // OKX-style Dashboard Styles
  dashboardContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  dashboardContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // OKX Header
  okxHeader: {
    backgroundColor: "#000000",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  okxHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  okxWelcome: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  okxNotifButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  okxNotifIcon: {
    fontSize: 16,
    color: "#F7931A",
  },

  // OKX Wallet Card
  okxWalletCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  okxWalletLeft: {
    flex: 1,
  },
  okxChainLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 4,
  },
  okxChainName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F7931A",
  },
  okxWalletRight: {
    marginLeft: 16,
  },

  // OKX Balance Section
  okxBalanceSection: {
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  okxBalanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  okxBalanceTitle: {
    fontSize: 16,
    color: "#888888",
    fontWeight: "500",
  },
  okxEyeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  okxEyeIcon: {
    fontSize: 14,
    color: "#888888",
  },
  okxBalanceAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  okxBalanceSubtext: {
    fontSize: 14,
    color: "#888888",
  },

  // OKX Quick Stats
  okxQuickStats: {
    flexDirection: "row",
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  okxStatCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
  },
  okxStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  okxStatEmoji: {
    fontSize: 16,
  },
  okxStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  okxStatLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 6,
    textAlign: "center",
  },
  okxStatTrend: {
    backgroundColor: "#1A4D1A",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  okxStatTrendText: {
    fontSize: 10,
    color: "#4ADA64",
    fontWeight: "600",
  },

  // OKX Tokens Section
  okxTokensSection: {
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  okxTokensHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  okxTokensTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  okxFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#333333",
  },
  okxFilterIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  okxFilterText: {
    fontSize: 12,
    color: "#888888",
    fontWeight: "500",
  },

  // OKX Loading State
  okxLoadingState: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  okxLoadingText: {
    fontSize: 14,
    color: "#888888",
    marginTop: 12,
  },

  // OKX Error State
  okxErrorState: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4D1A1A",
  },
  okxErrorIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  okxErrorText: {
    fontSize: 14,
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  okxRetryBtn: {
    backgroundColor: "#F7931A",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  okxRetryText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
  },

  // OKX Empty State
  okxEmptyState: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  okxEmptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  okxEmptyText: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    marginBottom: 16,
  },
  okxRefreshBtn: {
    backgroundColor: "#F7931A",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  okxRefreshText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
  },

  // OKX Token Items
  okxTokensList: {
    backgroundColor: "#000000",
  },
  okxTokenItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  okxTokenLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  okxTokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  okxTokenEmoji: {
    fontSize: 20,
  },
  okxTokenInfo: {
    flex: 1,
  },
  okxTokenSymbol: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  okxTokenName: {
    fontSize: 12,
    color: "#888888",
  },
  okxTokenRight: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  okxTokenBalance: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  okxTokenAddress: {
    fontSize: 10,
    color: "#888888",
    fontFamily: "monospace",
  },
  okxTokenArrow: {
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  okxArrowIcon: {
    fontSize: 18,
    color: "#888888",
    fontWeight: "300",
  },
});
