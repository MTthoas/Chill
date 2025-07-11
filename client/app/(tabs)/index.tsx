import { AppKitButton, useAppKit } from "@reown/appkit-wagmi-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useAccount, useChainId } from "wagmi";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { config } from "@/config/env";

const { width } = Dimensions.get("window");

// Types pour l'API
interface Token {
  contractAddress: string;
  decimals: number;
  name: string;
  readableBalance: number;
  symbol: string;
  tokenBalance: string;
  price_usd?: number;
  value_usd?: number;
}

interface ApiResponse {
  address: string;
  chain: string;
  native_balance: number;
  success: boolean;
  token_count: number;
  tokens: Token[];
  total_value_usd?: number;
}

interface AgentHealth {
  status: string;
  agent: string;
  address: string;
  timestamp: string;
}

interface AgentStatus {
  name: string;
  address: string;
  port: number;
  health: AgentHealth | null;
  isLoading: boolean;
  error: string | null;
}

function formatLargeNumber(num: number): string {
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toFixed(2);
}

// Fonction pour obtenir le nom de la chaîne
const getChainName = (chainId: number): string => {
  switch (chainId) {
    case 11155111:
      return "Sepolia Testnet";
    case 84532:
      return "Base Sepolia";
    case 80002:
      return "Polygon Amoy";
    case 747:
      return "Flow Mainnet";
    default:
      return `Chain ${chainId}`;
  }
};
const getChainEndpoint = (chainId: number): string | null => {
  console.log("Actual getChainEndpoint call with chainId:", chainId);
  switch (chainId) {
    case 11155111: // Sepolia
      return "ethereum";
    case 8453: // Base Sepolia
      return "base";
    case 80002: // Polygon Amoy
      return "polygon";
    case 747: // Flow Mainnet
      return "flow";
    default:
      return null;
  }
};

// Agent addresses and configuration
const AGENTS_CONFIG = [
  {
    name: "Intellect Agent",
    address:
      "agent1qf82uz69zk3dlw6k3y5aewlfaavcxed29a8w9rmxqsf20tgnwtx9xxdrf24",
    port: 8001,
  },
  {
    name: "Simon Agent",
    address:
      "agent1qvd8tt75720p60aggzlna7rep89rmadhrt67cllz486w4y6www06vquhcca",
    port: 8003,
  },
  {
    name: "News Agent",
    address:
      "agent1qw7xczpxattre89f398ljwfy2cpw7hpvy607l3zn8afdtdmxsufaww898sm",
    port: 8002,
  },
];

// Service pour récupérer les tokens
const fetchUserTokens = async (
  address: string,
  chainId: number
): Promise<ApiResponse | null> => {
  try {
    const endpoint = getChainEndpoint(chainId);
    if (!endpoint) {
      console.log(`Chain ${chainId} not supported`);
      return null;
    }

    const apiUrl = `${config.API_BASE_API_URL}/tokens/${endpoint}/${address}`;
    console.log(`Fetching tokens from: ${apiUrl}`);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    //console.log(`API Response:`, data);
    return data;
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return null;
  }
};

// Service pour récupérer la santé des agents
const fetchAgentHealth = async (port: number): Promise<AgentHealth | null> => {
  try {
    const response = await fetch(`${config.LOCAL_IP_ADDRESS}:${port}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const health: AgentHealth = await response.json();
    return health;
  } catch (error) {
    console.error(`Error fetching agent health on port ${port}:`, error);
    return null;
  }
};

export default function HomeScreen() {
  const { open } = useAppKit();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const [agentsStatus, setAgentsStatus] = useState<AgentStatus[]>(
    AGENTS_CONFIG.map((agent) => ({
      ...agent,
      health: null,
      isLoading: false,
      error: null,
    }))
  );

  // Fonction pour charger les données
  const loadTokenData = useCallback(async () => {
    if (!address || !isConnected) return;

    setLoading(true);
    setError(null);

    const data = await fetchUserTokens(address, chainId);

    if (data && data.success) {
      setTokens(data.tokens);
      // Use the real total_value_usd from the API instead of manual calculation
      setTotalValue(data.total_value_usd || 0);
      setError(null);
    } else {
      setTokens([]);
      setTotalValue(0);
      setError("Failed to fetch token data. Please check your connection.");
    }

    setLoading(false);
  }, [address, isConnected, chainId]);

  // Fonction pour charger le statut des agents
  const loadAgentsStatus = useCallback(async () => {
    console.log("Loading agents status...");

    // Set loading state for all agents
    setAgentsStatus((prev) =>
      prev.map((agent) => ({
        ...agent,
        isLoading: true,
        error: null,
      }))
    );

    // Fetch health for each agent
    const updatedStatuses = await Promise.all(
      AGENTS_CONFIG.map(async (agentConfig) => {
        try {
          const health = await fetchAgentHealth(agentConfig.port);
          return {
            ...agentConfig,
            health,
            isLoading: false,
            error: health ? null : "Agent not responding",
          };
        } catch (error) {
          return {
            ...agentConfig,
            health: null,
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    setAgentsStatus(updatedStatuses);
  }, []);

  // Charger les données au montage et changement de chaîne
  useEffect(() => {
    if (isConnected && address) {
      loadTokenData();
    }
  }, [isConnected, address, chainId, loadTokenData]);

  // Charger le statut des agents au montage
  useEffect(() => {
    loadAgentsStatus();
  }, [loadAgentsStatus]);

  // Fonction de refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTokenData(), loadAgentsStatus()]);
    setRefreshing(false);
  }, [loadTokenData, loadAgentsStatus]);

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.landingContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <ThemedView style={styles.headerSection}>
              <ThemedView style={styles.logoContainer}>
                <ThemedText style={styles.logoText}>⚡</ThemedText>
              </ThemedView>

              <ThemedText style={styles.title}>IntentFi</ThemedText>

              <ThemedText style={styles.tagline}>
                Smart Autonomous Scheduling for Financial Intents
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.ctaSection}>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => open()}
              >
                <ThemedView style={styles.buttonContainer}>
                  <ThemedText style={styles.connectButtonText}>
                    Connect Wallet & Start
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>

              <ThemedText style={styles.supportText}>
                Supported on Ethereum, Polygon, Arbitrum, Sepolia, Base & Flow
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.descriptionSection}>
              <ThemedText style={styles.description}>
                We are building IntentFi, a revolutionary platform that
                automates and optimizes your financial operations through
                intelligent intent scheduling.
              </ThemedText>

              <ThemedView style={styles.featuresGrid}>
                <ThemedView style={styles.featureCard}>
                  <ThemedText style={styles.featureIcon}>🤖</ThemedText>
                  <ThemedText style={styles.featureTitle}>
                    Autonomous
                  </ThemedText>
                  <ThemedText style={styles.featureDesc}>
                    AI-powered decision making
                  </ThemedText>
                </ThemedView>

                <ThemedView style={styles.featureCard}>
                  <ThemedText style={styles.featureIcon}>⚡</ThemedText>
                  <ThemedText style={styles.featureTitle}>Smart</ThemedText>
                  <ThemedText style={styles.featureDesc}>
                    Optimized execution
                  </ThemedText>
                </ThemedView>

                <ThemedView style={styles.featureCard}>
                  <ThemedText style={styles.featureIcon}>🎯</ThemedText>
                  <ThemedText style={styles.featureTitle}>
                    Intent-Based
                  </ThemedText>
                  <ThemedText style={styles.featureDesc}>
                    Focus on outcomes
                  </ThemedText>
                </ThemedView>

                <ThemedView style={styles.featureCard}>
                  <ThemedText style={styles.featureIcon}>🔒</ThemedText>
                  <ThemedText style={styles.featureTitle}>Secure</ThemedText>
                  <ThemedText style={styles.featureDesc}>
                    Enterprise-grade security
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Dashboard connecté
  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.dashboardContainer}>
        <ScrollView
          contentContainerStyle={styles.dashboardContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ThemedView style={styles.dashboardHeader}>
            <ThemedText style={styles.welcomeTitle}>
              Welcome to IntentFi 🎯
            </ThemedText>

            <ThemedView style={styles.walletSection}>
              <ThemedText style={styles.walletLabel}>Your Wallet</ThemedText>
              <ThemedText style={styles.chainIndicator}>
                Connected to {getChainName(chainId)}
              </ThemedText>
              <ThemedView style={styles.walletButtonContainer}>
                <AppKitButton />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.statsSection}>
            <ThemedText style={styles.sectionTitle}>
              Dashboard Overview
            </ThemedText>

            <ThemedView style={styles.statsGrid}>
              <ThemedView style={styles.statCard}>
                <ThemedText style={styles.statIcon}>💰</ThemedText>
                <ThemedText style={styles.statValue}>
                  ${formatLargeNumber(Number(totalValue.toFixed(2)))}
                </ThemedText>
                <ThemedText style={styles.statLabel}>
                  Total Portfolio
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.statCard}>
                <ThemedText style={styles.statIcon}>🎯</ThemedText>
                <ThemedText style={styles.statValue}>
                  {tokens.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Active Tokens</ThemedText>
              </ThemedView>

              <ThemedView style={styles.statCard}>
                <ThemedText style={styles.statIcon}>⚡</ThemedText>
                <ThemedText style={styles.statValue}>7</ThemedText>
                <ThemedText style={styles.statLabel}>Executed Today</ThemedText>
              </ThemedView>

              <ThemedView style={styles.statCard}>
                <ThemedText style={styles.statIcon}>📈</ThemedText>
                <ThemedText style={styles.statValue}>94%</ThemedText>
                <ThemedText style={styles.statLabel}>Success Rate</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.agentsSection}>
            <ThemedText style={styles.sectionTitle}>
              AI Agents Status
            </ThemedText>

            <ThemedView style={styles.agentsGrid}>
              {/* Existing Agent Cards */}
              {agentsStatus.map((agent, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.agentCard}
                  onPress={() => {
                    // Open agent profile URL in browser
                    const agentUrl = `https://agentverse.ai/agents/details/${agent.address}/profile`;
                    Linking.openURL(agentUrl).catch((err) =>
                      console.error("Failed to open URL:", err)
                    );
                  }}
                >
                  <ThemedView style={styles.agentHeader}>
                    <ThemedText style={styles.agentName}>
                      {agent.name}
                    </ThemedText>
                    <ThemedView
                      style={[
                        styles.statusIndicator,
                        {
                          backgroundColor:
                            agent.health?.status === "healthy"
                              ? "#4ade80"
                              : "#ef4444",
                        },
                      ]}
                    />
                  </ThemedView>

                  <ThemedText style={styles.agentStatus}>
                    {agent.isLoading
                      ? "Checking..."
                      : agent.health
                      ? agent.health.status
                      : "Offline"}
                  </ThemedText>

                  <ThemedText style={styles.agentPort}>
                    Port: {agent.port}
                  </ThemedText>

                  {agent.health && (
                    <ThemedText style={styles.agentTimestamp}>
                      {new Date(agent.health.timestamp).toLocaleTimeString()}
                    </ThemedText>
                  )}

                  {agent.error && (
                    <ThemedText style={styles.agentError}>
                      {agent.error}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              ))}

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
                  <ThemedView
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: "#4ade80" },
                    ]}
                  />
                </ThemedView>
                <ThemedText style={styles.chatAgentDescription}>
                  Chat with our intelligent IntentFi Agent
                </ThemedText>
                <ThemedText style={styles.chatAgentLink}>
                  🔗 Open a chat →
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.tokensSection}>
            <ThemedView style={styles.tokensSectionHeader}>
              <ThemedText style={styles.sectionTitleTokens}>Your Tokens</ThemedText>
              <TouchableOpacity
                style={styles.filterToggle}
                onPress={() => setHideSmallBalances(!hideSmallBalances)}
              >
                <ThemedText style={styles.filterToggleText}>
                  {hideSmallBalances ? "👁️" : "👁️‍🗨️"} Hide small balances
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {error && (
              <ThemedView style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadTokenData}
                >
                  <ThemedText style={styles.refreshButtonText}>
                    Retry
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}

            {loading ? (
              <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <ThemedText style={styles.loadingText}>
                  Loading tokens...
                </ThemedText>
              </ThemedView>
            ) : !error && tokens.length > 0 ? (
              <ThemedView style={styles.tokensList}>
                {tokens
                  .filter((token) => {
                    if (!hideSmallBalances) return true;
                    const tokenValue = token.value_usd || 0;
                    return tokenValue >= 0.01;
                  })
                  .map((token, index) => {
                    // Use real USD values from API instead of estimation
                    const tokenPrice = token.price_usd || 0;
                    const tokenValue = token.value_usd || 0;

                    return (
                      <ThemedView
                        key={`${token.contractAddress}-${index}`}
                        style={styles.tokenCard}
                      >
                        <ThemedView style={styles.tokenHeader}>
                          <ThemedText style={styles.tokenSymbol}>
                            {token.symbol}
                          </ThemedText>
                          <ThemedText style={styles.tokenValue}>
                            ${tokenValue.toFixed(2)}
                          </ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.tokenDetails}>
                          <ThemedText style={styles.tokenAmount}>
                            {token.readableBalance.toFixed(4)} {token.symbol}
                          </ThemedText>
                          <ThemedText style={styles.tokenPrice}>
                            ${tokenPrice.toFixed(2)}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    );
                  })}
              </ThemedView>
            ) : !error && tokens.length === 0 ? (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  No tokens found for this wallet on{" "}
                  {getChainEndpoint(chainId) || "this network"}
                </ThemedText>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadTokenData}
                >
                  <ThemedText style={styles.refreshButtonText}>
                    Refresh
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ) : null}
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },

  // Landing Page Styles
  landingContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 100, // Encore plus d'espace pour éviter la troncature
    paddingBottom: 40,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 50,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  logoText: {
    paddingVertical: 30, // Ajout de padding pour éviter la troncature
    fontSize: 40,
    color: "#fff",
  },
  title: {
    fontSize: 42, // Réduit légèrement
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 2,
    letterSpacing: -1,
    paddingVertical: 20, // Ajout de padding pour éviter la troncature
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  descriptionSection: {
    marginBottom: 50,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  description: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0)",
    gap: 16,
  },
  featureCard: {
    width: (width - 56) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
    padding: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    paddingTop: 4,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  featureDesc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 16,
  },
  ctaSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  connectButton: {
    borderRadius: 50,
    marginBottom: 20,
    backgroundColor: "#6366f1",
    elevation: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContainer: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 50,
    minWidth: 280,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  supportText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },

  // Dashboard Styles
  dashboardContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  dashboardContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 100, // Plus d'espace pour éviter le texte tronqué
    paddingBottom: 40,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  dashboardHeader: {
    backgroundColor: "rgba(0, 0, 0, 0)",
    alignItems: "center",
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24, // Réduit pour éviter la troncature
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  walletSection: {
    marginBottom: 20,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  walletLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
    textAlign: "center",
  },
  chainIndicator: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 12,
    textAlign: "center",
  },
  walletButtonContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statsSection: {
    marginBottom: 40,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  sectionTitle: {
    fontSize: 22, // Réduit pour éviter la troncature
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  sectionTitleTokens: {
    fontSize: 22, // Réduit pour éviter la troncature
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  statCard: {
    width: (width - 56) / 2,
    borderRadius: 20,
    padding: 20, // Réduit pour plus d'espace
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statIcon: {
    fontSize: 28, // Réduit
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24, // Réduit
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12, // Réduit
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },

  // Agents Section
  agentsSection: {
    marginBottom: 40,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  agentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },

  // Chat Agent Card (Full Width)
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

  agentCard: {
    width: (width - 56) / 3 - 4, // 3 cards per row with small gap
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  agentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    height: 50,
    marginBottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  agentName: {
    marginRight: 2,
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  agentStatus: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 4,
  },
  agentPort: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: 4,
  },
  agentTimestamp: {
    fontSize: 8,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
  },
  agentError: {
    fontSize: 8,
    color: "#ef4444",
    textAlign: "center",
    marginTop: 2,
  },

  // Tokens Section
  tokensSection: {
    marginTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0)",
    marginBottom: 60,
  },
  tokensSectionHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0)",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterToggle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterToggleText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  tokensList: {
    gap: 12,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  tokenCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tokenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tokenSymbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  tokenValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4ade80",
  },
  tokenDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenAmount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  tokenPrice: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },

  // Loading and empty states
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Error state
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 20,
  },
});
