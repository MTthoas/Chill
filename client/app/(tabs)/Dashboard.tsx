import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";

const API_URL = "https://chillguys.vercel.app/seasons";
const { width } = Dimensions.get("window");

export default function Dashboard() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [seasonId, setSeasonId] = useState<number | null>(null);
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

        const filteredSeasons = seasonsArray.find(
          (season: any) => season.special_id == 126393
        );

        setSeasonId(filteredSeasons?.special_id || null);
        // Wrap in array for FlatList compatibility
        const filteredSeasonsArr = filteredSeasons ? [filteredSeasons] : [];

        setCompetitions(filteredSeasonsArr);
      })
      .catch((err) => {
        console.error("Fetch error details:", err);
        setError(`Erreur: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ligues en cours</Text>
      <Text style={styles.instruction}>
        Touchez une ligue pour voir les détails
      </Text>
      <FlatList
        data={competitions}
        keyExtractor={(item) => item.id?.toString() || item.name}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardActive,
              ]}
              android_ripple={{ color: "#6366f1" }}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/League",
                  params: {
                    id: item.id,
                    name: item.name,
                    special_id: seasonId,
                  },
                })
              }
            >
              <Text
                style={[
                  styles.card,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                  },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune ligue trouvée.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
    paddingTop: 60,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    paddingTop: 16,
    letterSpacing: -1,
  },
  instruction: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 18,
    marginTop: 2,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 18,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 18,
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardActive: {
    backgroundColor: "#6366f1",
    color: "#fff",
  },
  empty: {
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    marginTop: 40,
    fontSize: 18,
  },
  error: { color: "#ef4444", marginTop: 70, textAlign: "center" },
});
