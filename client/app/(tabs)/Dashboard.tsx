import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

const API_URL = "https://chillguys.vercel.app/seasons";
const { width } = Dimensions.get("window");

export default function Dashboard() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("Attempting to fetch from:", `${API_URL}/seasons`);

    fetch(`${API_URL}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        console.log("Response status:", res.status);
        console.log("Response ok:", res.ok);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Data received:", data[0]);
        const seasonsArray = Array.isArray(data)
          ? data
          : data.data || data.seasons || [];

        // Filtrer et aplatir le tableau des saisons
        const filteredSeasons = seasonsArray.filter(
          (season: any) =>
            season.special_id == 126393 || season.special_id == 127105
        );
        // Si le backend renvoie un tableau imbriqué, on aplatit
        const flatSeasons = Array.isArray(filteredSeasons[0])
          ? filteredSeasons.flat()
          : filteredSeasons;
        console.log("Filtered seasons (flat):", flatSeasons);
        setCompetitions(flatSeasons);
      })
      .catch((err) => {
        console.error("Fetch error details:", err);
        setError(`Erreur: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.okxLoadingState}>
          <ActivityIndicator size="large" color="#F7931A" />
          <Text style={styles.okxLoadingText}>Loading leagues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.okxErrorState}>
          <Text style={styles.okxErrorIcon}>⚠️</Text>
          <Text style={styles.okxErrorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* OKX-style Header */}
        <View style={styles.okxHeader}>
          <Text style={styles.okxTitle}>⚽ Leagues</Text>
          <Text style={styles.okxSubtitle}>Select a league to explore</Text>
        </View>

        {/* Leagues List */}
        <View style={styles.okxContent}>
          {competitions.length > 0 ? (
            competitions.map((item, index) => (
              <TouchableOpacity
                key={item.id?.toString() || item.name || index}
                style={styles.okxLeagueCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/dashboard/League",
                    params: {
                      id: item.id,
                      name: item.name,
                      special_id: item.special_id,
                    },
                  })
                }
              >
                <View style={styles.okxLeagueLeft}>
                  <View style={styles.okxLeagueIcon}>
                    <Text style={styles.okxLeagueEmoji}>🏆</Text>
                  </View>
                  <View style={styles.okxLeagueInfo}>
                    <Text style={styles.okxLeagueName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.okxLeagueStatus}>Active Season</Text>
                  </View>
                </View>

                <View style={styles.okxLeagueRight}>
                  <View style={styles.okxLeagueBadge}>
                    <Text style={styles.okxLeagueBadgeText}>LIVE</Text>
                  </View>
                </View>

                <View style={styles.okxLeagueArrow}>
                  <Text style={styles.okxArrowIcon}>›</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.okxEmptyState}>
              <Text style={styles.okxEmptyIcon}>📭</Text>
              <Text style={styles.okxEmptyText}>No leagues found</Text>
            </View>
          )}
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

  // OKX Content
  okxContent: {
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // OKX League Cards
  okxLeagueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  okxLeagueLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  okxLeagueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  okxLeagueEmoji: {
    fontSize: 24,
  },
  okxLeagueInfo: {
    flex: 1,
  },
  okxLeagueName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  okxLeagueStatus: {
    fontSize: 12,
    color: "#888888",
  },
  okxLeagueRight: {
    marginRight: 12,
  },
  okxLeagueBadge: {
    backgroundColor: "#1A4D1A",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  okxLeagueBadgeText: {
    fontSize: 10,
    color: "#4ADA64",
    fontWeight: "700",
  },
  okxLeagueArrow: {
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  okxArrowIcon: {
    fontSize: 20,
    color: "#888888",
    fontWeight: "300",
  },

  // OKX Loading State
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

  // OKX Error State
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
  },

  // OKX Empty State
  okxEmptyState: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
    marginTop: 20,
  },
  okxEmptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  okxEmptyText: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
  },
});
