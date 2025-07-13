import { AppKitButton } from "@reown/appkit-wagmi-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAccount, useBalance, useChainId } from "wagmi";
import { useTokenPrices } from "../../hooks/useTokenPrices";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
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

export default function HomeScreen() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Use on-chain token balances instead of backend API
  const { tokens, refetch } = useOnChainTokenBalances();

  const { tokens: fanTokens, loading: fanTokensLoading } =
    useFanTokenBalances();

  const {
    data: chzBalance,
    isLoading: chzLoading,
    refetch: refetchChz,
  } = useBalance({
    address,
    chainId, // 88888 pour Chiliz Mainnet
  });

  const [refreshing, setRefreshing] = useState(false);
  const [hideSmallBalances, setHideSmallBalances] = useState(false);

  const allSymbols = useMemo(
    () => ["CHZ", ...fanTokens.map((t) => t.symbol)],
    [fanTokens, refreshing]
  );
  const {
    prices,
    loading: pricesLoading,
    error: pricesError,
  } = useTokenPrices(allSymbols, refreshing);

  // Calcul dynamique de la valeur totale du portfolio en $
  const totalValue =
    (chzBalance
      ? (Number(chzBalance.value) / 1e18) * (prices["CHZ"] || 0)
      : 0) +
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

  // Quick stats dynamiques depuis l'API
  const [quickStats, setQuickStats] = useState({
    topClubs: 0,
    status: "-",
    statusTrend: "-",
  });
  const [quickStatsLoading, setQuickStatsLoading] = useState(true);

  useEffect(() => {
    async function fetchQuickStats() {
      try {
        // Récupère le nombre de clubs via /competitors (utilise count)
        const resClubs = await fetch(
          "https://chillguys.vercel.app/competitors"
        );
        if (!resClubs.ok) throw new Error("Erreur API clubs");
        const clubs = await resClubs.json();
        setQuickStats((prev) => ({
          ...prev,
          topClubs: clubs && typeof clubs.count === "number" ? clubs.count : 0,
        }));
      } catch {
        setQuickStats((prev) => ({ ...prev, topClubs: 0 }));
      } finally {
        setQuickStatsLoading(false);
      }
    }
    fetchQuickStats();
  }, []);

  // Calcul dynamique du nombre de tokens (fan tokens + CHZ natif)
  const nbTokens = fanTokens.filter((token) => {
    const tokenValue =
      Number(token.readableBalance) * (prices[token.symbol] || 0);
    return tokenValue >= 0.01;
  }).length;

  // Si l'utilisateur n'est pas connecté, afficher la landing page
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          {/* Hero Section avec image de fond */}
          <View style={styles.heroSection}>
            <Image
              source={{
                uri: "https://www.shutterstock.com/shutterstock/videos/1030617476/thumb/1.jpg?ip=x480",
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroGradient}>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>TAKUMI PRO</Text>
                <Text style={styles.heroSubtitle}>
                  Next-Gen Fan Token Platform
                </Text>
                <Text style={styles.tagline}>
                  Discover the universe of Fan Tokens and maximize your earnings
                  with our premium trading platform
                </Text>
                <TouchableOpacity style={styles.connectButton}>
                  <AppKitButton label="Connect your wallet" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Premium Features</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>✨ PRO</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.featuresScroll}
            >
              {[
                {
                  icon: "💰",
                  title: "Portfolio Tracking",
                  desc: "Real-time portfolio analytics & insights",
                  gradient: ["#10b981", "#22c55e"],
                },
                {
                  icon: "⚽",
                  title: "Fan Tokens",
                  desc: "Trade your favorite team tokens",
                  gradient: ["#6366f1", "#8b5cf6"],
                },
                {
                  icon: "📊",
                  title: "Advanced Analytics",
                  desc: "Professional market analysis tools",
                  gradient: ["#f59e0b", "#f97316"],
                },
                {
                  icon: "🎯",
                  title: "Yield Farming",
                  desc: "Earn rewards through staking pools",
                  gradient: ["#ef4444", "#f97316"],
                },
                {
                  icon: "🚀",
                  title: "Early Access",
                  desc: "Get first access to new tokens",
                  gradient: ["#06b6d4", "#0891b2"],
                },
              ].map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.featureCardPremium,
                    {
                      borderColor: feature.gradient[0],
                      shadowColor: feature.gradient[0],
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.featureIconContainer,
                      { backgroundColor: feature.gradient[0] },
                    ]}
                  >
                    <Text style={styles.featureIconPremium}>
                      {feature.icon}
                    </Text>
                  </View>
                  <Text style={styles.featureTitlePremium}>
                    {feature.title}
                  </Text>
                  <Text style={styles.featureDescPremium}>{feature.desc}</Text>
                  <View
                    style={[
                      styles.featureGlow,
                      { backgroundColor: feature.gradient[0] },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Trusted by Athletes & Fans</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>50M+</Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>$2.5B</Text>
                <Text style={styles.statLabel}>Volume Traded</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>150+</Text>
                <Text style={styles.statLabel}>Sports Teams</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>99.9%</Text>
                <Text style={styles.statLabel}>Uptime</Text>
              </View>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <View style={styles.ctaCard}>
              <Text style={styles.ctaIcon}>🚀</Text>
              <Text style={styles.ctaTitle}>Ready to Start Trading?</Text>
              <Text style={styles.ctaDescription}>
                Connect your wallet and explore the Chiliz ecosystem with
                professional-grade tools
              </Text>
              <View style={styles.ctaButtons}>
                <TouchableOpacity style={styles.primaryButton}>
                  <AppKitButton />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard OKX-style pour utilisateurs connectés
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
              {nbTokens + (chzBalance ? 1 : 0)} Token
              {nbTokens + (chzBalance ? 1 : 0) !== 1 ? "s" : ""} •
              {pricesError ? " Estimated Prices" : " Live Market"}
              {pricesLoading && " 🔄"}
            </Text>
          </View>

          {/* OKX-style Quick Stats */}
          <ThemedView style={styles.agentsGrid}>
            {/* Chat Agent Card - Full Width */}
            <TouchableOpacity
              style={styles.chatAgentCard}
              onPress={() => {
                const chatUrl =
                  "https://agentverse.ai/agents/details/agent1qwlxt7alynn08f63r9qca9ahxee26k46w88wrr3q8v08znwmd5yq6ute7e9/profile";
                Linking.openURL(chatUrl).catch((err) =>
                  console.error("Failed to open chat URL:", err)
                );
              }}
            >
              <ThemedView style={styles.chatAgentHeader}>
                <ThemedText style={styles.chatAgentTitle}>
                  💬 Chat Agent
                </ThemedText>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: "#4ade80" },
                  ]}
                />
              </ThemedView>
              <ThemedText style={styles.chatAgentDescription}>
                Chat with our intelligent IntentFi Agent
              </ThemedText>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    "https://chat.agentverse.ai/sessions/e2f15a05-7122-4d00-b476-0c4531b9f790"
                  )
                }
              >
                <ThemedText style={styles.chatAgentLink}>
                  🔗 Open a chat →
                </ThemedText>
              </TouchableOpacity>
            </TouchableOpacity>
          </ThemedView>

          <View style={styles.okxQuickStats}>
            {quickStatsLoading ? (
              <ActivityIndicator size="small" color="#F7931A" />
            ) : (
              [
                {
                  icon: "💰",
                  value: `$${formatLargeNumber(Number(totalValue.toFixed(2)))}`,
                  label: "Portfolio",
                  trend: "+12.5%",
                },
                {
                  icon: "⚽",
                  value: nbTokens.toString(),
                  label: "Tokens",
                  trend: `+${fanTokens.length}`,
                },
                {
                  icon: "🏆",
                  value: quickStats.topClubs.toString(),
                  label: "Teams",
                  trend: "+10",
                },
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
              ))
            )}
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
                        {(Number(chzBalance.value) / 1e18).toFixed(4)}
                      </Text>
                      <Text style={styles.okxTokenValue}>
                        $
                        {(
                          (Number(chzBalance.value) / 1e18) *
                          (prices["CHZ"] || 0)
                        ).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.okxTokenArrow}>
                      <Text style={styles.okxArrowIcon}>›</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {/* Fan tokens dynamiques */}
                {fanTokens
                  .filter((token) => {
                    const tokenValue =
                      Number(token.readableBalance) *
                      (prices[token.symbol] || 0);
                    return tokenValue >= 0.01;
                  })
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
                          {Number(token.readableBalance).toFixed(4)}
                        </Text>
                        <Text style={styles.okxTokenValue}>
                          $
                          {(
                            Number(token.readableBalance) *
                            (prices[token.symbol] || 0)
                          ).toFixed(2)}
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
    backgroundColor: "#000000",
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
    backgroundColor: "rgba(0,0,0,0.7)",
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
    backgroundColor: "#000000",
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 3,
    borderColor: "rgba(139, 92, 246, 0.5)",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
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
    borderRadius: 20,
    overflow: "hidden",
    width: "70%",
    elevation: 10,
    shadowColor: "#F7931A",
    shadowOffset: { width: 0, height: 10 },
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
    width: 200,
    height: 160,
    marginRight: 18,
    borderRadius: 24,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    position: "relative",
    overflow: "hidden",
  },
  featuresScroll: {
    paddingLeft: 20,
    paddingVertical: 8,
  },
  featureIconPremium: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  featureTitlePremium: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescPremium: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  // Features Section
  featuresSection: {
    padding: 20,
    backgroundColor: "#000000",
  },
  sectionTitle: {
    fontSize: 22,
    paddingTop: 10,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
    textAlign: "left",
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
    backgroundColor: "#000000",
  },
  ctaCard: {
    padding: 30,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  agentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  chatAgentCard: {
    width: "100%", // Prend toute la largeur
    borderRadius: 16,
    padding: 20,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)", // Bordure violette
    backgroundColor: "rgba(139, 92, 246, 0.1)", // Fond violet clair
  },
  chatAgentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  chatAgentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  chatAgentDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 12,
    textAlign: "center",
  },
  chatAgentLink: {
    fontSize: 16,
    color: "#8b5cf6", // Couleur violette
    fontWeight: "600",
    textAlign: "center",
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
    paddingBottom: 48,
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
  okxTokenValue: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600",
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

  // Landing Page Premium Styles
  heroTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 2,
    textShadowColor: "rgba(139, 92, 246, 0.5)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F7931A",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  sectionBadgeText: {
    color: "#8b5cf6",
    fontSize: 12,
    fontWeight: "700",
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  featureGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    opacity: 0.1,
    zIndex: -1,
  },
  statsSection: {
    padding: 20,
    backgroundColor: "#000000",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(139, 92, 246, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    fontWeight: "500",
  },
  ctaIcon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 16,
  },
  ctaButtons: {
    alignItems: "center",
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 30,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  ctaFooter: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    fontWeight: "500",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
