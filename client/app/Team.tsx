import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const API_URL = "https://chillguys.vercel.app"; // Mets ici l'URL publique ou ton IP locale

export default function Team() {
  const params = useLocalSearchParams();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log("Fetching stats for:", params.id, params.seasonId);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching stats for:", params.id, params.seasonId);
        const res = await fetch(
          `${API_URL}/competitors/3/seasons/523/statistics`
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
    if (params.id && params.seasonId) fetchStats();
  }, [params.id, params.seasonId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />;
  if (error) return <Text style={styles.error}>test {error}</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{params.name}</Text>
      <Text style={styles.subtitle}>
        {params.short_name} ({params.abbreviation})
      </Text>
      <Text style={styles.info}>
        ID: {params.id} | Special ID: {params.special_id}
      </Text>
      {/* Affichage des stats principales */}
      {stats && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          {stats.statistics &&
            Object.entries(stats.statistics).map(([type, value]) => (
              <View key={type} style={styles.statRow}>
                <Text style={styles.statType}>{type}</Text>
                <Text style={styles.statValue}>{value as any}</Text>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#181a20", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 2 },
  subtitle: { fontSize: 18, color: "#6366f1", marginBottom: 8 },
  info: { fontSize: 13, color: "#aaa", marginBottom: 18 },
  statsSection: {
    marginTop: 18,
    backgroundColor: "#23262f",
    borderRadius: 16,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statType: { color: "#fff", fontWeight: "600", fontSize: 15 },
  statValue: { color: "#6366f1", fontWeight: "bold", fontSize: 15 },
  error: { color: "#ef4444", marginTop: 70, textAlign: "center" },
});
