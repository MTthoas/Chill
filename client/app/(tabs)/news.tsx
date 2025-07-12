import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useAccount } from "wagmi";

import { ExternalLink } from "@/components/ExternalLink";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { config } from "@/config/env";

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  timestamp: string;
  review?: string;
  rate?: "bullish" | "bearish" | "neutral";
}

interface NewsResponse {
  articles: NewsArticle[];
  total_articles: number;
  analyzed_articles?: number;
  timestamp: string;
  status: string;
}

export default function NewsScreen() {
  const { isConnected } = useAccount();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);

  const fetchNews = async () => {
    try {
      setError(null);
      const newsUrl = `${config.API_INTELLECT_AGENT_URL}/getAnalyzed`;
      console.log("Fetching analyzed news from:", newsUrl);
      const response = await fetch(newsUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: NewsResponse = await response.json();

      if (data.status === "success") {
        // Sort articles by timestamp (most recent first)
        const sortedArticles = data.articles.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setArticles(sortedArticles);
        setNewsData(data);
      } else {
        setError(`Failed to fetch news: ${data.status}`);
        setArticles([]);
        setNewsData(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      if (
        errorMessage.includes("Network request failed") ||
        errorMessage.includes("fetch")
      ) {
        setError(
          `Cannot connect to news service. Check if the backend is running`
        );
      } else {
        setError(`Failed to fetch news: ${errorMessage}`);
      }
      setArticles([]);
      console.error("Error fetching news:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNews();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchNews();
    }
  }, [isConnected]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return timestamp;
    }
  };

  const toggleArticleExpansion = (index: number) => {
    setExpandedArticle(expandedArticle === index ? null : index);
  };

  const getRatingEmoji = (rate?: string) => {
    switch (rate) {
      case "bullish":
        return "🚀";
      case "bearish":
        return "📉";
      case "neutral":
        return "⚖️";
      default:
        return "📰";
    }
  };

  const getRatingColor = (rate?: string) => {
    switch (rate) {
      case "bullish":
        return "#22c55e"; // green
      case "bearish":
        return "#ef4444"; // red
      case "neutral":
        return "#6b7280"; // gray
      default:
        return "#6366f1"; // default blue
    }
  };

  const getRatingText = (rate?: string) => {
    switch (rate) {
      case "bullish":
        return "Bullish";
      case "bearish":
        return "Bearish";
      case "neutral":
        return "Neutral";
      default:
        return "Not analyzed";
    }
  };

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.centeredContainer}>
          <ThemedText style={styles.connectMessage}>
            Please connect your wallet to view crypto news
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.newsContainer}>
        <ThemedView style={styles.headerSection}>
          <ThemedText style={styles.title}>📰 Crypto News</ThemedText>
          <ThemedText style={styles.subtitle}>
            Latest crypto and blockchain news
          </ThemedText>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <ThemedText style={styles.loadingText}>Loading news...</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNews}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <ThemedView style={styles.statsHeader}>
              <ThemedText style={styles.statsText}>
                📊 {articles.length} articles available
              </ThemedText>
              {newsData?.analyzed_articles !== undefined && (
                <ThemedText style={styles.statsSubText}>
                  🤖 {newsData.analyzed_articles} analyzed by AI
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.articlesList}>
              {articles.map((article, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.articleCard}
                  onPress={() => toggleArticleExpansion(index)}
                  activeOpacity={0.7}
                >
                  <ThemedView style={styles.articleHeader}>
                    <ThemedText style={styles.articleTitle} numberOfLines={2}>
                      {article.title}
                    </ThemedText>

                    {/* Rating Badge */}
                    {article.rate && (
                      <ThemedView
                        style={[
                          styles.ratingBadge,
                          { backgroundColor: getRatingColor(article.rate) },
                        ]}
                      >
                        <ThemedText style={styles.ratingEmoji}>
                          {getRatingEmoji(article.rate)}
                        </ThemedText>
                        <ThemedText style={styles.ratingText}>
                          {getRatingText(article.rate)}
                        </ThemedText>
                      </ThemedView>
                    )}

                    <ThemedView style={styles.articleMeta}>
                      <ThemedText style={styles.articleSource}>
                        📰 {article.source}
                      </ThemedText>
                      <ThemedText style={styles.articleTimestamp}>
                        🕒 {formatTimestamp(article.timestamp)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  {expandedArticle === index && (
                    <ThemedView style={styles.articleDetails}>
                      <ThemedText style={styles.articleDescription}>
                        {article.description}
                      </ThemedText>

                      {/* AI Analysis Review */}
                      {article.review && (
                        <ThemedView style={styles.reviewContainer}>
                          <ThemedText style={styles.reviewLabel}>
                            🤖 AI Analysis:
                          </ThemedText>
                          <ThemedText style={styles.reviewText}>
                            {article.review}
                          </ThemedText>
                        </ThemedView>
                      )}

                      <ThemedView style={styles.linkContainer}>
                        <ExternalLink
                          href={article.url as any}
                          style={styles.readMoreLink}
                        >
                          <ThemedView style={styles.linkButton}>
                            <ThemedText style={styles.linkText}>
                              🔗 Read Full Article
                            </ThemedText>
                          </ThemedView>
                        </ExternalLink>
                      </ThemedView>
                    </ThemedView>
                  )}

                  <ThemedView style={styles.expandIndicator}>
                    <ThemedText style={styles.expandText}>
                      {expandedArticle === index ? "▲ Collapse" : "▼ Read More"}
                    </ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </ThemedView>

            {articles.length === 0 && !loading && !error && (
              <ThemedView style={styles.noNewsContainer}>
                <ThemedText style={styles.noNewsText}>
                  📭 No news articles available
                </ThemedText>
                <ThemedText style={styles.noNewsSubtext}>
                  Pull down to refresh and check for new articles
                </ThemedText>
              </ThemedView>
            )}
          </ScrollView>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  newsContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  connectMessage: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 26,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    paddingVertical: 20, // Ajout de padding pour éviter la troncature
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  statsHeader: {
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
    paddingBottom: 20,
  },
  statsText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  statsSubText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0)",
    marginTop: 4,
  },
  articlesList: {
    gap: 16,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  articleCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.65)",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  articleHeader: {
    marginBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 24,
    marginBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  articleMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  articleSource: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
  },
  articleTimestamp: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  articleDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  articleDescription: {
    fontSize: 15,
    backgroundColor: "rgba(0, 0, 0, 0)",
    lineHeight: 22,
    marginBottom: 20,
  },
  linkContainer: {
    alignItems: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  readMoreLink: {
    textDecorationLine: "none",
  },
  linkButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  linkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  expandIndicator: {
    alignItems: "center",
    paddingTop: 12,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  expandText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
  },
  noNewsContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  noNewsText: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 8,
  },
  noNewsSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 8,
    alignSelf: "flex-start",
  },
  ratingEmoji: {
    fontSize: 12,
    marginRight: 4,
    color: "#fff",
  },
  ratingText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  reviewContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#6366f1",
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
});
