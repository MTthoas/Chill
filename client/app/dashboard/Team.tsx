import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");

const API_URL = "https://chillguys.vercel.app"; // Mets ici l'URL publique ou ton IP locale

// Mapping emojis pour les stats
const statEmojis: { [key: string]: string } = {
  goals_scored: "⚽️",
  goals_conceded: "🥅",
  matches_played: "📅",
  yellow_cards: "🟨",
  red_cards: "🟥",
  assists: "🎯",
  shots_on_target: "🎯",
  shots_off_target: "🚀",
  average_ball_possession: "🕰️",
  corner_kicks: "🚩",
  free_kicks: "🦶",
  offsides: "🚦",
  shots_total: "🔫",
  shots_blocked: "🛡️",
};

export default function Team() {
  const params = useLocalSearchParams();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id || !params.seasonId) return;
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/competitors/${params.id}/seasons/${params.seasonId}/statistics`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStats(data.competitor || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [params.id, params.seasonId]);

  if (!params.id || !params.seasonId) {
    return (
      <View style={styles.container}>
        <Text style={styles.okxTitle}>
          Sélectionnez une équipe depuis la ligue
        </Text>
      </View>
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section OKX-style */}
      <View style={styles.okxHeader}>
        <Text style={styles.okxTitle}>
          {params.emoji ? params.emoji + " " : ""}
          {params.name}
        </Text>
        <Text style={styles.okxSubtitle}>
          {params.short_name} ({params.abbreviation})
        </Text>
        <View style={styles.idContainer}>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>ID: {params.id}</Text>
          </View>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>Special: {params.special_id}</Text>
          </View>
        </View>
      </View>

      {/* Recommandation IA Section */}
      {stats &&
        Array.isArray(stats.competitorStatsAdvices) &&
        stats.competitorStatsAdvices.length > 0 && (
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiTitle}>🤖 Recommandation IA</Text>
              {stats.competitorStatsAdvices[0].order && (
                <View
                  style={[
                    styles.orderBadge,
                    stats.competitorStatsAdvices[0].order === "buy"
                      ? styles.buyBadge
                      : styles.sellBadge,
                  ]}
                >
                  <Text style={styles.orderText}>
                    {stats.competitorStatsAdvices[0].order === "buy"
                      ? "📈 ACHETER"
                      : "📉 VENDRE"}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.aiAdvice}>
              {stats.competitorStatsAdvices[0].advice}
            </Text>
          </View>
        )}

      {/* Statistics Grid OKX-style */}
      {stats &&
        Array.isArray(stats.statistics) &&
        stats.statistics.length > 0 && (
          <View style={styles.okxStatsContainer}>
            <Text style={styles.sectionTitle}>
              📊 Statistiques de l&apos;équipe
            </Text>
            <View style={styles.statsGrid}>
              {stats.statistics.map((stat: any) => (
                <View key={stat.id} style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {statEmojis[stat.type] ? statEmojis[stat.type] + " " : ""}
                    {stat.value}
                  </Text>
                  <Text style={styles.statLabel}>
                    {formatStatType(stat.type)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

      {/* Players Section OKX-style */}
      {stats && Array.isArray(stats.players) && stats.players.length > 0 && (
        <View style={styles.playersContainer}>
          <Text style={styles.sectionTitle}>⚽ Statistiques des joueurs</Text>
          {stats.players
            .filter(
              (player: any) => player.statistics && player.statistics.length > 0
            )
            .map((player: any) => (
              <View key={player.id} style={styles.playerCard}>
                <Text style={styles.playerName}>
                  {player.emoji ? player.emoji + " " : ""}
                  {player.name}
                </Text>
                <View style={styles.playerStatsGrid}>
                  {player.statistics.slice(0, 6).map((stat: any) => (
                    <View key={stat.id} style={styles.playerStatItem}>
                      <Text style={styles.playerStatValue}>
                        {statEmojis[stat.type]
                          ? statEmojis[stat.type] + " "
                          : ""}
                        {stat.value}
                      </Text>
                      <Text style={styles.playerStatLabel}>
                        {formatStatType(stat.type)}
                      </Text>
                    </View>
                  ))}
                </View>
                {player.statistics.length > 6 && (
                  <TouchableOpacity style={styles.showMoreButton}>
                    <Text style={styles.showMoreText}>
                      Voir toutes les stats ({player.statistics.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// Helper function to format stat types
const formatStatType = (type: string) => {
  const translations: { [key: string]: string } = {
    goals_scored: "Buts",
    goals_conceded: "Buts encaissés",
    matches_played: "Matchs",
    yellow_cards: "Cartons jaunes",
    red_cards: "Cartons rouges",
    assists: "Passes décisives",
    shots_on_target: "Tirs cadrés",
    shots_off_target: "Tirs non cadrés",
    average_ball_possession: "Possession (%)",
    corner_kicks: "Corners",
    free_kicks: "Coups francs",
    offsides: "Hors-jeux",
    shots_total: "Tirs totaux",
    shots_blocked: "Tirs bloqués",
  };

  return (
    translations[type] ||
    type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1419",
  },
  // OKX-style header
  okxHeader: {
    backgroundColor: "#161622",
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2f3e",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  okxTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  okxSubtitle: {
    fontSize: 16,
    color: "#a78bfa",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
  idContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  idBadge: {
    backgroundColor: "#2a2f3e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6366f1",
    marginHorizontal: 4,
  },
  idText: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "600",
  },
  // AI Section
  aiSection: {
    backgroundColor: "#1a1f2e",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#a78bfa",
    shadowColor: "#a78bfa",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  aiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#a78bfa",
  },
  orderBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buyBadge: {
    backgroundColor: "#10b981",
  },
  sellBadge: {
    backgroundColor: "#ef4444",
  },
  orderText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  aiAdvice: {
    color: "#e5e7eb",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  // Statistics Grid OKX-style
  okxStatsContainer: {
    backgroundColor: "#1a1f2e",
    borderRadius: 16,
    padding: 24,
    marginVertical: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#2a2f3e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#23263a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: (width - 80) / 3,
    flex: 1,
    borderWidth: 1,
    borderColor: "#2a2f3e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#6366f1",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    fontWeight: "600",
  },
  // Players Section OKX-style
  playersContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  playerCard: {
    backgroundColor: "#1a1f2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2f3e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  playerStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  playerStatItem: {
    backgroundColor: "#23263a",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    minWidth: (width - 104) / 3,
    flex: 1,
    marginBottom: 6,
  },
  playerStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 4,
    textAlign: "center",
  },
  playerStatLabel: {
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "center",
    fontWeight: "500",
  },
  showMoreButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "center",
    marginTop: 12,
  },
  showMoreText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 32,
  },
  error: {
    color: "#ef4444",
    marginTop: 70,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
