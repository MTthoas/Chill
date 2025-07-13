import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

// Mock data for league teams - replace with your API call
const MOCK_TEAMS = [
  {
    id: 1,
    name: "Paris Saint-Germain",
    country: "France",
    points: 85,
    position: 1,
  },
  { id: 2, name: "FC Barcelona", country: "Spain", points: 82, position: 2 },
  {
    id: 3,
    name: "Manchester City",
    country: "England",
    points: 78,
    position: 3,
  },
  { id: 4, name: "Bayern Munich", country: "Germany", points: 75, position: 4 },
  { id: 5, name: "Real Madrid", country: "Spain", points: 72, position: 5 },
];

const LEAGUE_STATS = [
  { icon: "⚽", value: "248", label: "Goals", trend: "+12" },
  { icon: "👥", value: "5", label: "Teams", trend: "Active" },
  { icon: "📅", value: "32", label: "Matches", trend: "+4" },
  { icon: "🟢", value: "Live", label: "Status", trend: "ON" },
];

const TEAM_EMOJIS = ["🇫🇷", "🇪🇸", "🏴", "🇩🇪", "🇪🇸"];

export default function League() {
  const [teams, setTeams] = useState(MOCK_TEAMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.okxLoadingState}>
          <ActivityIndicator size="large" color="#F7931A" />
          <Text style={styles.okxLoadingText}>Loading league data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.okxErrorState}>
          <Text style={styles.okxErrorIcon}>d</Text>
          <Text style={styles.okxErrorText}>{error}</Text>
          <TouchableOpacity style={styles.okxRetryBtn} activeOpacity={0.8}>
            <Text style={styles.okxRetryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* OKX-style Header */}
        <View style={styles.okxHeader}>
          <Text style={styles.okxTitle}> Champions League</Text>
          <Text style={styles.okxSubtitle}>2023-24 Season " Group Stage</Text>
        </View>

        {/* League Stats */}
        <View style={styles.okxStatsSection}>
          <Text style={styles.okxStatsTitle}>League Stats</Text>
          <View style={styles.okxStatsGrid}>
            {LEAGUE_STATS.map((stat, index) => (
              <View key={index} style={styles.okxStatCard}>
                <View style={styles.okxStatIcon}>
                  <Text style={styles.okxStatEmoji}>{stat.icon}</Text>
                </View>
                <Text style={styles.okxStatValue}>{stat.value}</Text>
                <Text style={styles.okxStatLabel}>{stat.label}</Text>
                <View style={styles.okxStatTrend}>
                  <Text style={styles.okxStatTrendText}>{stat.trend}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Teams Rankings */}
        <View style={styles.okxTeamsSection}>
          <View style={styles.okxTeamsHeader}>
            <Text style={styles.okxTeamsTitle}>Team Rankings</Text>
            <TouchableOpacity style={styles.okxFilterBtn} activeOpacity={0.7}>
              <Text style={styles.okxFilterIcon}>=�</Text>
              <Text style={styles.okxFilterText}>Stats</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.okxTeamsList}>
            {teams.map((team, index) => (
              <TouchableOpacity
                key={team.id}
                style={styles.okxTeamCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/dashboard/Team",
                    params: {
                      id: team.id,
                      name: team.name,
                    },
                  })
                }
              >
                <View style={styles.okxTeamLeft}>
                  <View style={styles.okxTeamPosition}>
                    <Text style={styles.okxPositionText}>#{team.position}</Text>
                  </View>
                  <View style={styles.okxTeamIcon}>
                    <Text style={styles.okxTeamEmoji}>
                      {TEAM_EMOJIS[index % TEAM_EMOJIS.length]}
                    </Text>
                  </View>
                  <View style={styles.okxTeamInfo}>
                    <Text style={styles.okxTeamName} numberOfLines={1}>
                      {team.name}
                    </Text>
                    <Text style={styles.okxTeamCountry}>{team.country}</Text>
                  </View>
                </View>

                <View style={styles.okxTeamRight}>
                  <Text style={styles.okxTeamPoints}>{team.points}</Text>
                  <Text style={styles.okxTeamPointsLabel}>PTS</Text>
                </View>

                <View style={styles.okxTeamArrow}>
                  <Text style={styles.okxArrowIcon}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  // OKX Header
  okxHeader: {
    backgroundColor: "#000000",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  okxTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  okxSubtitle: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
  },

  // League Stats
  okxStatsSection: {
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  okxStatsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  okxStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
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

  // Teams Section
  okxTeamsSection: {
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  okxTeamsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  okxTeamsTitle: {
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

  // Team Cards
  okxTeamsList: {
    backgroundColor: "#000000",
  },
  okxTeamCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  okxTeamLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  okxTeamPosition: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F7931A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  okxPositionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000000",
  },
  okxTeamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  okxTeamEmoji: {
    fontSize: 20,
  },
  okxTeamInfo: {
    flex: 1,
  },
  okxTeamName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  okxTeamCountry: {
    fontSize: 12,
    color: "#888888",
  },
  okxTeamRight: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  okxTeamPoints: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F7931A",
    marginBottom: 2,
  },
  okxTeamPointsLabel: {
    fontSize: 10,
    color: "#888888",
    fontWeight: "600",
  },
  okxTeamArrow: {
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  okxArrowIcon: {
    fontSize: 18,
    color: "#888888",
    fontWeight: "300",
  },

  // Loading and Error States
  okxLoadingState: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  okxLoadingText: {
    fontSize: 14,
    color: "#888888",
    marginTop: 12,
    textAlign: "center",
  },
  okxErrorState: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  okxErrorIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  okxErrorText: {
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
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
});
