import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Pressable,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function League() {
  const { id, name, special_id } = useLocalSearchParams();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsMap, setTeamsMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      console.log("Fetching data for league:", id, name, special_id);
      try {
        // Récupère les équipes d'abord pour avoir les logos
        const teamsRes = await fetch(
          `https://chillguys.vercel.app/competitors?season_id=${id}`
        );
        const teamsData = await teamsRes.json();
        const teamsArray = teamsData.data || [];
        setTeams(teamsArray);

        // Crée une map des équipes par nom pour le lookup rapide
        const teamsByName = new Map();
        teamsArray.forEach((team: any) => {
          teamsByName.set(team.name, team);
          if (team.short_name) {
            teamsByName.set(team.short_name, team);
          }
        });
        setTeamsMap(teamsByName);

        // Récupère les matchs à venir
        const matchesRes = await fetch(
          `https://chillguys.vercel.app/seasons/${special_id}/upcoming-matches`
        );
        const matchesData = await matchesRes.json();
        const matchesArray = matchesData.upcomingMatches?.slice(0, 3) || [];

        // Enrichit les matchs avec les logos des équipes
        const enrichedMatches = matchesArray.map((match: any) => {
          const homeTeam = teamsByName.get(match.home_team);
          const awayTeam = teamsByName.get(match.away_team);

          return {
            ...match,
            home_team_logo: homeTeam?.logo || null,
            away_team_logo: awayTeam?.logo || null,
            home_team_data: homeTeam || null,
            away_team_data: awayTeam || null,
          };
        });

        setMatches(enrichedMatches);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, name, special_id]);

  console.log(teams);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  // Render OKX-style
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* OKX-style Header */}
        <View style={styles.okxHeader}>
          <Text style={styles.okxTitle}>League dashboard</Text>
          <Text style={styles.okxSubtitle}>Group Stage</Text>
        </View>
        {/* Prochains matchs - OKX style */}
        <View style={{ marginTop: 12, marginBottom: 24 }}>
          <Text
            style={[styles.sectionTitle, { marginLeft: 16, marginBottom: 16 }]}
          >
            🗓️ Prochains matchs
          </Text>
          <View style={{ flexDirection: "column", gap: 16 }}>
            {matches.length === 0 ? (
              <Text style={styles.empty}>Aucun match à venir</Text>
            ) : (
              matches.map((match, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: "#23262f",
                    borderRadius: 18,
                    padding: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    marginHorizontal: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.13,
                    shadowRadius: 12,
                    borderWidth: 1.5,
                    borderColor: "#363a45",
                  }}
                >
                  {/* Home Team */}
                  <View style={{ alignItems: "center", flex: 2 }}>
                    {match.home_team_logo ? (
                      <Image
                        source={{ uri: match.home_team_logo }}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          marginBottom: 4,
                        }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.logoPlaceholder} />
                    )}
                    <Text
                      style={[
                        styles.teamNameBetclic,
                        { fontSize: 15, marginBottom: 0 },
                      ]}
                      numberOfLines={1}
                    >
                      {match.home_team}
                    </Text>
                  </View>
                  {/* VS + Date/Heure */}
                  <View
                    style={{
                      flex: 3,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={[styles.vsText, { fontSize: 18, marginBottom: 2 }]}
                    >
                      VS
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      <Text style={[styles.matchDateBetclic, { fontSize: 13 }]}>
                        {match.start_time
                          ? new Date(match.start_time).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : ""}
                      </Text>
                    </View>
                  </View>
                  {/* Away Team */}
                  <View style={{ alignItems: "center", flex: 2 }}>
                    {match.away_team_logo ? (
                      <Image
                        source={{ uri: match.away_team_logo }}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          marginBottom: 4,
                        }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.logoPlaceholder} />
                    )}
                    <Text
                      style={[
                        styles.teamNameBetclic,
                        { fontSize: 15, marginBottom: 0 },
                      ]}
                      numberOfLines={1}
                    >
                      {match.away_team}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
        {/* Teams Rankings */}
        <View style={styles.okxTeamsSection}>
          <View style={styles.okxTeamsHeader}>
            <Text style={styles.okxTeamsTitle}>Team list</Text>
            <TouchableOpacity style={styles.okxFilterBtn} activeOpacity={0.7}>
              <Text style={styles.okxFilterIcon}>📊</Text>
              <Text style={styles.okxFilterText}>Stats</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.okxTeamsList}>
            {teams.map((team, index) => (
              <TouchableOpacity
                key={team.id}
                style={styles.okxTeamCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/dashboard/Team",
                    params: {
                      ...team,
                      seasonId: id,
                    },
                  })
                }
              >
                <View style={styles.okxTeamLeft}>
                  <View style={styles.okxTeamIcon}>
                    {team.logo ? (
                      <Image
                        source={{ uri: team.logo }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          marginTop: 2,
                        }}
                        resizeMode="contain"
                      />
                    ) : null}
                  </View>
                  <View style={styles.okxTeamInfo}>
                    <Text style={styles.okxTeamName} numberOfLines={1}>
                      {team.name}
                    </Text>
                  </View>
                </View>
                <View style={styles.okxTeamRight}>
                  <Text style={styles.okxTeamPoints}>{team.points}</Text>
                </View>
                <View style={styles.okxTeamArrow}>
                  <Text style={styles.okxArrowIcon}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  teamLogoContainer: {
    marginRight: 16,
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  teamLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  teamInitials: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  teamTextContainer: {
    flex: 1,
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
  // OKX-style specific
  scrollContainer: {
    flex: 1,
  },
  okxHeader: {
    backgroundColor: "#101214",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2c2f36",
  },
  okxTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  okxSubtitle: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "500",
  },
  okxStatsSection: {
    backgroundColor: "#101214",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2c2f36",
  },
  okxStatsTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  okxStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  okxStatCard: {
    backgroundColor: "#23262f",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: "48%",
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#2c2f36",
  },
  okxStatIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  okxStatEmoji: {
    fontSize: 24,
  },
  okxStatValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  okxStatLabel: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  okxStatTrend: {
    flexDirection: "row",
    alignItems: "center",
  },
  okxStatTrendText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "500",
  },
  okxTeamsSection: {
    backgroundColor: "#101214",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2c2f36",
  },
  okxTeamsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  okxTeamsTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  okxFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#23262f",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2c2f36",
  },
  okxFilterIcon: {
    color: "#6366f1",
    fontSize: 16,
    marginRight: 4,
  },
  okxFilterText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  okxTeamsList: {
    maxHeight: height / 2,
  },
  okxTeamCard: {
    backgroundColor: "#23262f",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2c2f36",
  },
  okxTeamLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  okxTeamPosition: {
    backgroundColor: "#191b22",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 12,
  },
  okxPositionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  okxTeamIcon: {
    marginRight: 12,
  },
  okxTeamEmoji: {
    fontSize: 24,
  },
  okxTeamInfo: {
    flex: 1,
  },
  okxTeamName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  okxTeamCountry: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "400",
  },
  okxTeamRight: {
    alignItems: "flex-end",
  },
  okxTeamPoints: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  okxTeamPointsLabel: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "400",
  },
  okxTeamArrow: {
    marginLeft: 8,
  },
  okxArrowIcon: {
    color: "#6366f1",
    fontSize: 18,
  },
});
