import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function League() {
  const { id, name, special_id } = useLocalSearchParams();
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      console.log("Fetching data for league:", id, name, special_id);
      try {
        // Récupère les matchs à venir
        const matchesRes = await fetch(
          `https://chillguys.vercel.app/seasons/${special_id}/upcoming-matches`
        );
        const matchesData = await matchesRes.json();
        setMatches(matchesData.upcomingMatches?.slice(0, 3) || []);

        // Récupère les équipes
        const teamsRes = await fetch(
          `https://chillguys.vercel.app/competitors?season_id=${id}`
        );
        const teamsData = await teamsRes.json();
        setTeams(teamsData.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>Ligue d'homme</Text>
      <View style={styles.matchesSection}>
        <Text style={styles.sectionTitle}>Futurs matchs</Text>
        {matches.length === 0 ? (
          <Text style={styles.empty}>Aucun match à venir</Text>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => item.id?.toString() || item.special_id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesList}
            renderItem={({ item }) => {
              // Mapping du status façon Betclic
              let statusLabel = "";
              let statusColor = "#6366f1";
              switch (item.status) {
                case "not_started":
                case "scheduled":
                  statusLabel = "À venir";
                  statusColor = "#6366f1";
                  break;
                case "live":
                  statusLabel = "En cours";
                  statusColor = "#22c55e";
                  break;
                case "ended":
                case "closed":
                  statusLabel = "Terminé";
                  statusColor = "#ef4444";
                  break;
                default:
                  statusLabel = item.status || "";
                  statusColor = "#aaa";
              }

              // Format date façon Betclic
              const dateObj = new Date(item.start_time);
              const dateStr = dateObj.toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "2-digit",
                month: "long",
              });
              const timeStr = dateObj.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <View style={styles.betclicMatchCard}>
                  <View style={styles.teamsRow}>
                    <View style={styles.teamCol}>
                      <View style={styles.logoPlaceholder} />
                      <Text style={styles.teamNameBetclic} numberOfLines={1}>
                        {item.home_team}
                      </Text>
                    </View>
                    <View style={styles.vsCol}>
                      <Text style={styles.vsText}>VS</Text>
                      <View style={styles.dateTimeBox}>
                        <Text style={styles.matchDateBetclic}>{dateStr}</Text>
                        <Text style={styles.matchTimeBetclic}>{timeStr}</Text>
                      </View>
                    </View>
                    <View style={styles.teamCol}>
                      <View style={styles.logoPlaceholder} />
                      <Text style={styles.teamNameBetclic} numberOfLines={1}>
                        {item.away_team}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.venueRow}>
                    <Text style={styles.venueText}>{item.venue || "-"}</Text>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
      <View style={styles.teamsSection}>
        <Text style={styles.sectionTitle}>Équipes disponibles</Text>
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id?.toString() || item.name}
          contentContainerStyle={styles.teamsList}
          renderItem={({ item }) => (
            <View style={styles.teamCardBetclic}>
              <View style={styles.teamInfoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamNameBetclic}>{item.name}</Text>
                  {item.short_name && (
                    <Text style={styles.teamShortName}>{item.short_name}</Text>
                  )}
                </View>
                {item.abbreviation && (
                  <View style={styles.abbrBadge}>
                    <Text style={styles.abbrText}>{item.abbreviation}</Text>
                  </View>
                )}
              </View>
              {item.country && (
                <Text style={styles.teamCountryBetclic}>{item.country}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucune équipe trouvée.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181a20",
    paddingTop: 80,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 2,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#6366f1",
    textAlign: "center",
    marginBottom: 18,
    fontWeight: "600",
  },
  matchesSection: {
    height: height / 3.2,
    width: width,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: 18,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    marginLeft: 18,
  },
  matchesList: {
    paddingLeft: 18,
    paddingRight: 8,
  },
  betclicMatchCard: {
    backgroundColor: "#23262f",
    borderRadius: 24,
    marginRight: 18,
    width: width * 0.82,
    minHeight: 120,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: "#363a45",
    marginBottom: 6,
    justifyContent: "center",
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamCol: {
    flex: 3,
    alignItems: "center",
  },
  logoPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#181a20",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#363a45",
  },
  teamNameBetclic: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
    textAlign: "left",
    maxWidth: "90%",
  },
  vsCol: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    color: "#ff4655",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 1,
    marginBottom: 2,
  },
  matchTimeBetclic: {
    color: "#6366f1",
    fontWeight: "600",
    fontSize: 13,
    backgroundColor: "#191b22",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  matchDateBetclic: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  dateTimeBox: {
    backgroundColor: "#191b22",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
    alignItems: "center",
  },
  venueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  venueText: {
    color: "#aaa",
    fontSize: 13,
    fontStyle: "italic",
  },
  statusText: {
    color: "#ff4655",
    fontWeight: "bold",
    fontSize: 13,
  },
  teamsSection: {
    flex: 1,
    paddingTop: 18,
    backgroundColor: "rgba(0,0,0,0)",
  },
  teamsList: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  teamCard: {
    backgroundColor: "#23262f",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  teamCardBetclic: {
    backgroundColor: "#23262f",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    flexDirection: "column",
  },
  teamInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamShortName: {
    fontSize: 15,
    color: "#6366f1",
    fontWeight: "500",
    marginBottom: 2,
  },
  abbrBadge: {
    backgroundColor: "#191b22",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#363a45",
  },
  abbrText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
  teamCountryBetclic: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 6,
    fontStyle: "italic",
  },
  empty: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 40,
    fontSize: 16,
  },
  error: { color: "#ef4444", marginTop: 70, textAlign: "center" },
});
