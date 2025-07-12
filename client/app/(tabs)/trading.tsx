import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useAccount, useChainId } from "wagmi";
import { config } from "@/config/env";

// Types pour les recommandations - Format JSON plat
interface TradingRecommendation {
  token_symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  confidence_level?: string;
  reasoning: string;
  news_sentiment?: string;
  price_target?: number | null;
  stop_loss?: number | null;
  timestamp: string;
  received_at?: string;
  // Champs optionnels pour le market context (ajout futur)
  current_price?: number;
  trend?: string;
  support?: number;
  resistance?: number;
}

// Types pour les tokens du wallet
interface WalletToken {
  contractAddress: string;
  decimals: number;
  name: string;
  readableBalance: number;
  symbol: string;
  tokenBalance: string;
}

interface WalletApiResponse {
  address: string;
  chain: string;
  native_balance: number;
  success: boolean;
  token_count: number;
  tokens: WalletToken[];
  total_value_usd?: number;
}

const getChainEndpoint = (chainId: number): string | null => {
  switch (chainId) {
    case 8888:
    case 8882:
      return "chiliz";
    default:
      return null;
  }
};

const fetchUserTokens = async (
  address: string,
  chainId: number
): Promise<WalletApiResponse | null> => {
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

    const data: WalletApiResponse = await response.json();
    console.log(`API Response:`, data);
    return data;
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return null;
  }
};

const API_BASE_URL = config.API_INTELLECT_AGENT_URL || "http://localhost:8001";

export default function TradingScreen() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [recommendation, setRecommendation] =
    useState<TradingRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState<WalletToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fonction pour charger les tokens du wallet de l'utilisateur
  const loadUserTokens = useCallback(async () => {
    if (!address || !isConnected) return;

    setLoadingTokens(true);
    setError(null);

    try {
      const data = await fetchUserTokens(address, chainId);

      if (data && data.success) {
        // Filtrer pour garder seulement les tokens avec un balance > 0
        const tokensWithBalance = data.tokens.filter(
          (token) => token.readableBalance && token.readableBalance > 0
        );
        setUserTokens(tokensWithBalance);
        console.log(`Loaded ${tokensWithBalance.length} tokens with balance`);
      } else {
        console.log("No tokens found or API error");
        setUserTokens([]);
      }
    } catch (err) {
      console.error("Error loading tokens:", err);
      setError("Error loading tokens");
      setUserTokens([]);
    } finally {
      setLoadingTokens(false);
    }
  }, [address, chainId, isConnected]);

  // Charger les tokens au montage du composant
  useEffect(() => {
    loadUserTokens();
  }, [loadUserTokens]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserTokens().finally(() => setRefreshing(false));
  }, [loadUserTokens]);

  const fetchRecommendation = async (token: string, retryCount = 0) => {
    setLoading(true);
    setError(null);

    const maxRetries = 2;
    const timeout = 30000; // 30 secondes timeout

    try {
      // Créer un controller pour gérer le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${API_BASE_URL}/trading/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token_symbol: token }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Raw API response:", JSON.stringify(data, null, 2));

      // Nouveau format JSON plat - vérifier si on a une réponse directe
      if (data.token_symbol && data.action) {
        // Format plat direct
        console.log("Using flat JSON format");

        // Mapping pour s'assurer que les actions sont au bon format
        const actionMapping: { [key: string]: "buy" | "sell" | "hold" } = {
          buy: "buy",
          sell: "sell",
          hold: "hold",
          ACHETER: "buy",
          VENDRE: "sell",
          CONSERVER: "hold",
          BUY: "buy",
          SELL: "sell",
          HOLD: "hold",
        };

        console.log("Original action from API:", data.action);
        const mappedAction =
          actionMapping[data.action?.toUpperCase()] || "hold";
        console.log("Mapped action:", mappedAction);

        const recommendationData: TradingRecommendation = {
          token_symbol: data.token_symbol,
          action: mappedAction,
          confidence: data.confidence || 0,
          confidence_level: data.confidence_level,
          reasoning: data.reasoning || "No analysis available",
          news_sentiment: data.news_sentiment,
          price_target: data.price_target,
          stop_loss: data.stop_loss,
          timestamp: data.timestamp,
          received_at: data.received_at,
          // Market context optionnel
          current_price: data.current_price,
          trend: data.trend,
          support: data.support,
          resistance: data.resistance,
        };
        setRecommendation(recommendationData);
      } else if (data.success && data.analysis) {
        // Format ancien (legacy) - pour compatibilité
        console.log("Using legacy nested format");

        const actionMapping: { [key: string]: "buy" | "sell" | "hold" } = {
          buy: "buy",
          sell: "sell",
          hold: "hold",
          ACHETER: "buy",
          VENDRE: "sell",
          CONSERVER: "hold",
          BUY: "buy",
          SELL: "sell",
          HOLD: "hold",
        };

        console.log("Original action from API:", data.analysis?.action);
        const mappedAction =
          actionMapping[data.analysis?.action?.toUpperCase()] || "hold";
        console.log("Mapped action:", mappedAction);

        const recommendationData: TradingRecommendation = {
          token_symbol: data.analysis.token || token,
          action: mappedAction,
          confidence: data.analysis.confidence || 0,
          reasoning: data.analysis.reasoning || "No analysis available",
          news_sentiment: data.analysis.news_sentiment,
          price_target: data.analysis.price_target,
          stop_loss: data.analysis.stop_loss,
          timestamp: data.analysis.timestamp,
          current_price: data.analysis.market_context?.current_price,
          trend: data.analysis.market_context?.trend,
          support: data.analysis.market_context?.support,
          resistance: data.analysis.market_context?.resistance,
        };
        setRecommendation(recommendationData);
      } else {
        // Gestion d'erreur améliorée avec fallback
        const errorMessage =
          data.error || data.message || "Error retrieving recommendation";

        // Si c'est un timeout ou une erreur de connexion, proposer un fallback
        if (
          errorMessage.toLowerCase().includes("timeout") ||
          errorMessage.toLowerCase().includes("connection") ||
          errorMessage.toLowerCase().includes("failed to deliver")
        ) {
          console.log(
            `Connection issue detected, creating fallback recommendation for ${token}`
          );

          // Créer une recommandation de fallback basique
          const fallbackRecommendation: TradingRecommendation = {
            token_symbol: token,
            action: "hold",
            confidence: 0.1, // Très faible confiance pour indiquer que c'est un fallback
            confidence_level: "Very Low (Fallback)",
            reasoning: `⚠️ Backend analysis unavailable due to connection issues. This is a conservative fallback recommendation. Please try again later for a complete analysis. Error: ${errorMessage}`,
            news_sentiment: "neutral",
            price_target: null,
            stop_loss: null,
            timestamp: new Date().toISOString(),
            received_at: new Date().toISOString(),
            current_price: undefined,
            trend: "unknown",
            support: undefined,
            resistance: undefined,
          };

          setRecommendation(fallbackRecommendation);
          setError(
            `⚠️ Using fallback analysis due to backend issues. Recommendation may not be current.`
          );
          return;
        }

        setError(errorMessage);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);

      // Gestion spécifique des différents types d'erreur
      if (err.name === "AbortError") {
        // Timeout
        if (retryCount < maxRetries) {
          console.log(`Timeout, retrying... (${retryCount + 1}/${maxRetries})`);
          setError(
            `⏱️ Request timeout, retrying... (${retryCount + 1}/${maxRetries})`
          );

          // Attendre un peu avant de retry
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * (retryCount + 1))
          );
          return fetchRecommendation(token, retryCount + 1);
        } else {
          // Tous les retries épuisés, créer un fallback
          console.log(`Max retries reached, creating fallback for ${token}`);

          const fallbackRecommendation: TradingRecommendation = {
            token_symbol: token,
            action: "hold",
            confidence: 0.05,
            confidence_level: "Critical (Timeout)",
            reasoning: `🔄 Backend analysis timed out after ${
              maxRetries + 1
            } attempts. This is a conservative recommendation. The backend may be experiencing high load or connectivity issues. Please try again in a few minutes.`,
            news_sentiment: "neutral",
            price_target: null,
            stop_loss: null,
            timestamp: new Date().toISOString(),
            received_at: new Date().toISOString(),
          };

          setRecommendation(fallbackRecommendation);
          setError(
            "⏱️ Analysis timed out. Using conservative fallback recommendation."
          );
        }
      } else if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError")
      ) {
        // Erreur de réseau
        if (retryCount < maxRetries) {
          console.log(
            `Network error, retrying... (${retryCount + 1}/${maxRetries})`
          );
          setError(
            `🌐 Network error, retrying... (${retryCount + 1}/${maxRetries})`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, 3000 * (retryCount + 1))
          );
          return fetchRecommendation(token, retryCount + 1);
        } else {
          const fallbackRecommendation: TradingRecommendation = {
            token_symbol: token,
            action: "hold",
            confidence: 0.05,
            confidence_level: "Critical (Network)",
            reasoning: `🌐 Unable to connect to analysis backend after ${
              maxRetries + 1
            } attempts. This could be due to network issues or backend maintenance. Please check your connection and try again later.`,
            news_sentiment: "neutral",
            price_target: null,
            stop_loss: null,
            timestamp: new Date().toISOString(),
            received_at: new Date().toISOString(),
          };

          setRecommendation(fallbackRecommendation);
          setError(
            "🌐 Network connection failed. Using fallback recommendation."
          );
        }
      } else {
        // Autres erreurs
        if (retryCount < maxRetries) {
          console.log(
            `Unexpected error, retrying... (${retryCount + 1}/${maxRetries}):`,
            err
          );
          setError(
            `⚠️ Unexpected error, retrying... (${retryCount + 1}/${maxRetries})`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1))
          );
          return fetchRecommendation(token, retryCount + 1);
        } else {
          setError(
            `❌ Analysis failed: ${
              err.message || "Unknown error"
            }. Please try again later.`
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSelect = (token: string) => {
    setSelectedToken(token);
    fetchRecommendation(token);
  };

  const handleTradingIntent = (
    action: "buy" | "sell",
    token: string,
    price?: number,
    type?: string
  ) => {
    const actionText = action === "buy" ? "buy" : "sell";
    let message = `You want to ${actionText} ${token}.`;

    if (price && type) {
      message += `\nPrice: $${price.toFixed(6)} (${type})`;
    }

    message +=
      "\n\nThis feature will soon be connected to smart contracts to execute your trading intent.";

    Alert.alert(`${actionText.toUpperCase()} Intent`, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm Intent",
        onPress: () =>
          console.log(
            `Intent logged: ${action} ${token} at ${price || "market"} (${
              type || "market"
            })`
          ),
      },
    ]);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "buy":
        return "#4CAF50";
      case "sell":
        return "#F44336";
      case "hold":
        return "#FF9800";
      default:
        return "#FFFFFF";
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "buy":
        return "BUY";
      case "sell":
        return "SELL";
      case "hold":
        return "HOLD";
      default:
        return action.toUpperCase();
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "#4CAF50";
      case "negative":
        return "#F44336";
      case "neutral":
        return "#FF9800";
      default:
        return "#FFFFFF";
    }
  };

  const getSentimentText = (sentiment: string) => {
    const sentimentMap: { [key: string]: string } = {
      positive: "POSITIVE 📈",
      negative: "NEGATIVE 📉",
      neutral: "NEUTRAL ➡️",
    };
    return sentimentMap[sentiment.toLowerCase()] || sentiment.toUpperCase();
  };

  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case "bullish":
      case "up":
        return "#4CAF50";
      case "bearish":
      case "down":
        return "#F44336";
      case "sideways":
      case "neutral":
        return "#FF9800";
      default:
        return "#FFFFFF";
    }
  };

  const calculateDistance = (current: number, target: number) => {
    const distance = Math.abs(((target - current) / current) * 100);
    return `${distance.toFixed(1)}%`;
  };

  const calculatePricePosition = (
    current: number,
    support: number,
    resistance: number
  ) => {
    if (resistance <= support) return 50; // Fallback si les données sont invalides
    const position = ((current - support) / (resistance - support)) * 100;
    return Math.max(0, Math.min(100, position));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trading</Text>
          <Text style={styles.headerSubtitle}>
            AI-powered recommendations for your portfolio
          </Text>
        </View>

        {/* Vérifier si l'utilisateur est connecté */}
        {!isConnected ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIcon}>
              <Text style={styles.emptyStateEmoji}>🔗</Text>
            </View>
            <Text style={styles.emptyStateTitle}>Connect Wallet</Text>
            <Text style={styles.emptyStateText}>
              Connect your wallet to view tokens and get trading recommendations
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.portfolioSection}>
              <Text style={styles.sectionTitle}>Your Portfolio</Text>

              {loadingTokens ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#00D4AA" />
                  <Text style={styles.loadingText}>Loading tokens...</Text>
                </View>
              ) : userTokens.length > 0 ? (
                <View style={styles.tokenList}>
                  {userTokens.map((token) => {
                    const isSelected = selectedToken === token.symbol;
                    const isRisky =
                      recommendation?.confidence !== undefined &&
                      recommendation.confidence <= 0.2;

                    return (
                      <TouchableOpacity
                        key={token.contractAddress}
                        style={[
                          styles.tokenCard,
                          isSelected && styles.tokenCardSelected,
                          isSelected && isRisky && styles.tokenCardRisky,
                        ]}
                        onPress={() => handleTokenSelect(token.symbol)}
                        disabled={loading}
                        activeOpacity={0.7}
                      >
                        <View style={styles.tokenCardContent}>
                          <View style={styles.tokenInfo}>
                            <View
                              style={[
                                styles.tokenIcon,
                                isSelected && { backgroundColor: "#00D4AA" },
                              ]}
                            >
                              <Text style={styles.tokenIconText}>
                                {token.symbol.substring(0, 2).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.tokenDetails}>
                              <Text style={styles.tokenSymbol}>
                                {token.symbol}
                              </Text>
                              <Text style={styles.tokenName}>{token.name}</Text>
                            </View>
                          </View>
                          <View style={styles.tokenBalance}>
                            <Text style={styles.tokenBalanceText}>
                              {token.readableBalance.toFixed(4)}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateIcon}>
                    <Text style={styles.emptyStateEmoji}>💰</Text>
                  </View>
                  <Text style={styles.emptyStateTitle}>No tokens found</Text>
                  <Text style={styles.emptyStateText}>
                    No tokens with balance found in your wallet
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {loading && selectedToken && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.loadingText}>Analyzing {selectedToken}...</Text>
          </View>
        )}

        {error && (
          <View
            style={[
              styles.errorContainer,
              error.includes("fallback") && styles.fallbackErrorContainer,
              error.includes("retrying") && styles.retryErrorContainer,
            ]}
          >
            <Text
              style={[
                styles.errorText,
                error.includes("fallback") && styles.fallbackErrorText,
                error.includes("retrying") && styles.retryErrorText,
              ]}
            >
              {error}
            </Text>
            {error.includes("fallback") && (
              <Text style={styles.errorSubtext}>
                💡 Tip: Try refreshing in a few minutes for a complete analysis
              </Text>
            )}
            {error.includes("retrying") && (
              <ActivityIndicator
                size="small"
                color="#FF9800"
                style={styles.retryIndicator}
              />
            )}
          </View>
        )}

        {recommendation && !loading && (
          <View style={styles.recommendationContainer}>
            <Text style={styles.sectionTitle}>
              Recommendation for {recommendation.token_symbol}
            </Text>

            <View
              style={[
                styles.recommendationCard,
                recommendation.confidence <= 0.2 && styles.warningCard,
                recommendation.confidence <= 0.1 && styles.fallbackCard,
              ]}
            >
              {recommendation.confidence <= 0.1 ? (
                <View style={styles.fallbackBanner}>
                  <Text style={styles.fallbackText}>
                    🔄 FALLBACK ANALYSIS 🔄
                  </Text>
                  <Text style={styles.fallbackSubtext}>
                    Backend unavailable - Conservative recommendation
                  </Text>
                </View>
              ) : recommendation.confidence <= 0.2 ? (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>⚠️ HIGH RISK TOKEN ⚠️</Text>
                  <Text style={styles.warningSubtext}>
                    Unknown or suspicious token detected
                  </Text>
                </View>
              ) : null}

              <View style={styles.actionContainer}>
                <Text
                  style={[
                    styles.actionText,
                    { color: getActionColor(recommendation.action) },
                  ]}
                >
                  {getActionText(recommendation.action)}
                </Text>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confidence:</Text>
                  <Text
                    style={[
                      styles.confidenceValue,
                      {
                        color:
                          recommendation.confidence <= 0.2
                            ? "#F44336"
                            : "#00D4AA",
                      },
                    ]}
                  >
                    {Math.round(recommendation.confidence * 100)}%
                  </Text>
                </View>
              </View>

              {/* Market Context Section */}
              {(recommendation.current_price ||
                recommendation.trend ||
                recommendation.support ||
                recommendation.resistance) && (
                <View style={styles.marketContextContainer}>
                  <Text style={styles.sectionHeader}>Market Analysis</Text>

                  {recommendation.current_price && (
                    <View style={styles.marketDataRow}>
                      <View style={styles.marketDataItem}>
                        <Text style={styles.marketLabel}>Current Price</Text>
                        <Text style={styles.marketValue}>
                          ${recommendation.current_price.toFixed(6)}
                        </Text>
                      </View>

                      {recommendation.trend && (
                        <View style={styles.marketDataItem}>
                          <Text style={styles.marketLabel}>Trend</Text>
                          <Text
                            style={[
                              styles.marketValue,
                              {
                                color: getTrendColor(recommendation.trend),
                              },
                            ]}
                          >
                            {recommendation.trend.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {recommendation.support &&
                    recommendation.resistance &&
                    recommendation.current_price && (
                      <>
                        <View style={styles.supportResistanceContainer}>
                          <View style={styles.levelItem}>
                            <Text
                              style={[styles.levelLabel, { color: "#F44336" }]}
                            >
                              Support
                            </Text>
                            <Text
                              style={[styles.levelValue, { color: "#F44336" }]}
                            >
                              ${recommendation.support.toFixed(6)}
                            </Text>
                            <Text style={styles.levelDistance}>
                              -
                              {calculateDistance(
                                recommendation.current_price,
                                recommendation.support
                              )}
                            </Text>
                          </View>

                          <View style={styles.levelItem}>
                            <Text
                              style={[styles.levelLabel, { color: "#4CAF50" }]}
                            >
                              Resistance
                            </Text>
                            <Text
                              style={[styles.levelValue, { color: "#4CAF50" }]}
                            >
                              ${recommendation.resistance.toFixed(6)}
                            </Text>
                            <Text style={styles.levelDistance}>
                              +
                              {calculateDistance(
                                recommendation.current_price,
                                recommendation.resistance
                              )}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.pricePositionContainer}>
                          <Text style={styles.pricePositionLabel}>
                            Price Position (Support ↔ Resistance)
                          </Text>
                          <View style={styles.priceBar}>
                            <Text style={styles.supportLabel}>S</Text>
                            <View
                              style={[
                                styles.priceIndicator,
                                {
                                  left: `${calculatePricePosition(
                                    recommendation.current_price,
                                    recommendation.support,
                                    recommendation.resistance
                                  )}%`,
                                },
                              ]}
                            />
                            <Text style={styles.resistanceLabel}>R</Text>
                          </View>
                        </View>
                      </>
                    )}
                </View>
              )}

              {/* Targets Section */}
              {(recommendation.price_target || recommendation.stop_loss) && (
                <View style={styles.priceContainer}>
                  {recommendation.price_target && (
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Target Price</Text>
                      <Text style={[styles.priceValue, { color: "#4CAF50" }]}>
                        ${recommendation.price_target.toFixed(6)}
                      </Text>
                    </View>
                  )}
                  {recommendation.stop_loss && (
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Stop Loss</Text>
                      <Text style={[styles.priceValue, { color: "#F44336" }]}>
                        ${recommendation.stop_loss.toFixed(6)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Sentiment */}
              {recommendation.news_sentiment && (
                <View style={styles.sentimentContainer}>
                  <Text style={styles.sentimentLabel}>News Sentiment:</Text>
                  <Text
                    style={[
                      styles.sentimentValue,
                      {
                        color: getSentimentColor(recommendation.news_sentiment),
                      },
                    ]}
                  >
                    {getSentimentText(recommendation.news_sentiment)}
                  </Text>
                </View>
              )}

              <View style={styles.reasoningContainer}>
                <Text style={styles.reasoningTitle}>Analysis:</Text>
                <Text style={styles.reasoningText}>
                  {recommendation.reasoning}
                </Text>
              </View>

              <Text style={styles.timestamp}>
                Generated:{" "}
                {new Date(recommendation.timestamp).toLocaleString("en-US")}
              </Text>

              {/* Trading Intent Buttons - Désactivés pour les fallbacks */}
              {recommendation.confidence > 0.3 && (
                <View style={styles.intentButtonsContainer}>
                  <Text style={styles.intentTitle}>Trading Intents</Text>

                  {/* Main Action Buttons */}
                  {recommendation.action !== "hold" && (
                    <View style={styles.intentSection}>
                      <Text style={styles.intentSectionTitle}>
                        Recommended Action
                      </Text>
                      <View style={styles.intentButtons}>
                        {recommendation.action === "buy" && (
                          <TouchableOpacity
                            style={[styles.intentButton, styles.buyButton]}
                            onPress={() =>
                              handleTradingIntent(
                                "buy",
                                recommendation.token_symbol
                              )
                            }
                            activeOpacity={0.8}
                          >
                            <Text style={styles.intentButtonText}>
                              📈 BUY {recommendation.token_symbol}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {recommendation.action === "sell" && (
                          <TouchableOpacity
                            style={[styles.intentButton, styles.sellButton]}
                            onPress={() =>
                              handleTradingIntent(
                                "sell",
                                recommendation.token_symbol
                              )
                            }
                            activeOpacity={0.8}
                          >
                            <Text style={styles.intentButtonText}>
                              📉 SELL {recommendation.token_symbol}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Price-Specific Intent Buttons */}
                  {(recommendation.price_target ||
                    recommendation.stop_loss) && (
                    <View style={styles.intentSection}>
                      <Text style={styles.intentSectionTitle}>
                        Price-Based Intents
                      </Text>
                      <View style={styles.priceIntentButtons}>
                        {recommendation.price_target && (
                          <TouchableOpacity
                            style={[
                              styles.priceIntentButton,
                              styles.targetButton,
                            ]}
                            onPress={() =>
                              handleTradingIntent(
                                recommendation.action === "sell"
                                  ? "sell"
                                  : "buy",
                                recommendation.token_symbol,
                                recommendation.price_target || undefined,
                                "Target Price"
                              )
                            }
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.priceIntentLabel,
                                { color: "#4CAF50" },
                              ]}
                            >
                              {recommendation.action === "sell"
                                ? "SELL"
                                : "BUY"}{" "}
                              at Target
                            </Text>
                            <Text
                              style={[
                                styles.priceIntentValue,
                                { color: "#4CAF50" },
                              ]}
                            >
                              ${recommendation.price_target.toFixed(6)}
                            </Text>
                          </TouchableOpacity>
                        )}

                        {recommendation.stop_loss && (
                          <TouchableOpacity
                            style={[
                              styles.priceIntentButton,
                              styles.stopLossButton,
                            ]}
                            onPress={() =>
                              handleTradingIntent(
                                "sell",
                                recommendation.token_symbol,
                                recommendation.stop_loss || undefined,
                                "Stop Loss"
                              )
                            }
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.priceIntentLabel,
                                { color: "#F44336" },
                              ]}
                            >
                              SELL at Stop Loss
                            </Text>
                            <Text
                              style={[
                                styles.priceIntentValue,
                                { color: "#F44336" },
                              ]}
                            >
                              ${recommendation.stop_loss.toFixed(6)}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Support/Resistance Intent Buttons */}
                  {recommendation.support && recommendation.resistance && (
                    <View style={styles.intentSection}>
                      <Text style={styles.intentSectionTitle}>
                        Technical Levels
                      </Text>
                      <View style={styles.priceIntentButtons}>
                        <TouchableOpacity
                          style={[
                            styles.priceIntentButton,
                            styles.supportButton,
                          ]}
                          onPress={() =>
                            handleTradingIntent(
                              "buy",
                              recommendation.token_symbol,
                              recommendation.support,
                              "Support Level"
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.priceIntentLabel,
                              { color: "#2196F3" },
                            ]}
                          >
                            BUY at Support
                          </Text>
                          <Text
                            style={[
                              styles.priceIntentValue,
                              { color: "#2196F3" },
                            ]}
                          >
                            ${recommendation.support.toFixed(6)}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.priceIntentButton,
                            styles.resistanceButton,
                          ]}
                          onPress={() =>
                            handleTradingIntent(
                              "sell",
                              recommendation.token_symbol,
                              recommendation.resistance,
                              "Resistance Level"
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.priceIntentLabel,
                              { color: "#FF9800" },
                            ]}
                          >
                            SELL at Resistance
                          </Text>
                          <Text
                            style={[
                              styles.priceIntentValue,
                              { color: "#FF9800" },
                            ]}
                          >
                            ${recommendation.resistance.toFixed(6)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <Text style={styles.intentDisclaimer}>
                    Educational recommendations only. Always do your own
                    research.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {!selectedToken && !loading && isConnected && userTokens.length > 0 && (
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              Select a token above to get a trading recommendation based on the
              latest news analysis.
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
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  portfolioSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  tokenList: {
    gap: 12,
  },
  tokenCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tokenCardSelected: {
    borderColor: "#00D4AA",
    backgroundColor: "rgba(0, 212, 170, 0.1)",
  },
  tokenCardRisky: {
    borderColor: "#F44336",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  tokenCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tokenIconText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  tokenDetails: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tokenName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  tokenBalance: {
    alignItems: "flex-end",
  },
  tokenBalanceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00D4AA",
  },
  emptyStateContainer: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 16,
    marginVertical: 16,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateEmoji: {
    fontSize: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  errorText: {
    color: "#F44336",
    textAlign: "center",
    fontSize: 14,
  },
  recommendationContainer: {
    marginTop: 24,
  },
  recommendationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 90,
  },
  warningCard: {
    borderColor: "#F44336",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  warningBanner: {
    backgroundColor: "#F44336",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  warningText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  warningSubtext: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  actionContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  actionText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  confidenceLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginRight: 4,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  marketContextContainer: {
    backgroundColor: "rgba(33, 150, 243, 0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.2)",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  marketDataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  marketDataItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  marketLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
  },
  marketValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  supportResistanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  levelItem: {
    flex: 1,
    alignItems: "center",
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  levelDistance: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
  },
  pricePositionContainer: {
    marginTop: 8,
  },
  pricePositionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
    textAlign: "center",
  },
  priceBar: {
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    position: "relative",
    justifyContent: "center",
  },
  priceIndicator: {
    position: "absolute",
    width: 12,
    height: 12,
    backgroundColor: "#2196F3",
    borderRadius: 6,
    top: 4,
    zIndex: 2,
  },
  supportLabel: {
    position: "absolute",
    left: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#F44336",
    top: 4,
  },
  resistanceLabel: {
    position: "absolute",
    right: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    top: 4,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
  },
  priceItem: {
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: "rgba(255, 255, 255, 0.6)",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  sentimentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 6,
  },
  sentimentLabel: {
    fontSize: 14,
    marginRight: 6,
    color: "rgba(255, 255, 255, 0.7)",
  },
  sentimentValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  reasoningContainer: {
    marginBottom: 16,
  },
  reasoningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  reasoningText: {
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 16,
  },
  instructionContainer: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 16,
    marginTop: 16,
  },
  instructionText: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 22,
    fontSize: 14,
  },
  // Trading Intent Buttons Styles
  intentButtonsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  intentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    color: "#FFFFFF",
  },
  intentButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  intentButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buyButton: {
    backgroundColor: "#4CAF50",
  },
  sellButton: {
    backgroundColor: "#F44336",
  },
  intentButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  intentDisclaimer: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 8,
  },
  // Intent Sections
  intentSection: {
    marginBottom: 16,
  },
  intentSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  priceIntentButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  priceIntentButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    borderWidth: 1,
  },
  priceIntentLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  priceIntentValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  targetButton: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderColor: "#4CAF50",
  },
  stopLossButton: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderColor: "#F44336",
  },
  supportButton: {
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    borderColor: "#2196F3",
  },
  resistanceButton: {
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    borderColor: "#FF9800",
  },
  // Styles pour les états d'erreur améliorés
  fallbackErrorContainer: {
    backgroundColor: "rgba(255, 152, 0, 0.15)",
    borderColor: "rgba(255, 152, 0, 0.4)",
  },
  retryErrorContainer: {
    backgroundColor: "rgba(33, 150, 243, 0.15)",
    borderColor: "rgba(33, 150, 243, 0.4)",
  },
  fallbackErrorText: {
    color: "#FF9800",
  },
  retryErrorText: {
    color: "#2196F3",
  },
  errorSubtext: {
    fontSize: 12,
    color: "rgba(255, 152, 0, 0.8)",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  retryIndicator: {
    marginTop: 8,
  },
  // Styles pour les cartes et bannières de fallback
  fallbackCard: {
    borderColor: "#FF9800",
    backgroundColor: "rgba(255, 152, 0, 0.15)",
  },
  fallbackBanner: {
    backgroundColor: "#FF9800",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  fallbackText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  fallbackSubtext: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
