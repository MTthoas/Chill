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
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSeasonStaking } from "../../hooks/useSeasonStaking";

const { width, height } = Dimensions.get("window");

export default function League() {
  const { id, name, special_id } = useLocalSearchParams();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsMap, setTeamsMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");

  // Hook pour le staking
  const {
    stakingInfo,
    loading: stakingLoading,
    error: stakingError,
    stake,
    claim,
    withdraw,
  } = useSeasonStaking();

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

        {/* Section Staking PSG Fan Token */}
        {String(id) === "523" && (
          <View style={styles.stakingSection}>
            <View style={styles.stakingHeader}>
              <Text style={styles.stakingTitle}>🎯 PSG Fan Token Pool</Text>
              <Text style={styles.stakingSubtitle}>
                Stake PSG • Earn CHILL Rewards
              </Text>
            </View>

            {/* Informations de la pool */}
            <View style={styles.poolInfoCard}>
              <View style={styles.poolInfoRow}>
                <View style={styles.poolInfoItem}>
                  <Text style={styles.poolInfoLabel}>Mon solde PSG</Text>
                  <Text style={styles.poolInfoValue}>
                    {parseFloat(stakingInfo.fanTokenBalance).toFixed(2)} PSG
                  </Text>
                </View>
                <View style={styles.poolInfoItem}>
                  <Text style={styles.poolInfoLabel}>Staké</Text>
                  <Text style={styles.poolInfoValue}>
                    {parseFloat(stakingInfo.stakedAmount).toFixed(2)} PSG
                  </Text>
                </View>
              </View>

              <View style={styles.poolInfoRow}>
                <View style={styles.poolInfoItem}>
                  <Text style={styles.poolInfoLabel}>Récompenses</Text>
                  <Text style={styles.poolInfoValue}>
                    {parseFloat(stakingInfo.pendingRewards).toFixed(2)} CHILL
                  </Text>
                </View>
                <View style={styles.poolInfoItem}>
                  <Text style={styles.poolInfoLabel}>Fin de pool</Text>
                  <Text style={styles.poolInfoValue}>
                    {stakingInfo.seasonEndTimestamp > 0
                      ? new Date(
                          stakingInfo.seasonEndTimestamp * 1000
                        ).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </Text>
                </View>
              </View>

              {/* Statut de la pool */}
              <View style={styles.poolStatusContainer}>
                <View
                  style={[
                    styles.poolStatusBadge,
                    {
                      backgroundColor: stakingInfo.poolClosed
                        ? "#ef4444"
                        : "#10b981",
                    },
                  ]}
                >
                  <Text style={styles.poolStatusText}>
                    {stakingInfo.poolClosed ? "Pool fermée" : "Pool active"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions de staking */}
            {!stakingInfo.poolClosed && (
              <View style={styles.stakingActions}>
                <View style={styles.stakeInputContainer}>
                  <TextInput
                    style={styles.stakeInput}
                    placeholder="Montant à staker..."
                    placeholderTextColor="#9ca3af"
                    value={stakeAmount}
                    onChangeText={setStakeAmount}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, styles.stakeButton]}
                    onPress={async () => {
                      if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
                        Alert.alert(
                          "Erreur",
                          "Veuillez entrer un montant valide"
                        );
                        return;
                      }

                      const success = await stake(stakeAmount);
                      if (success) {
                        setStakeAmount("");
                        Alert.alert("Succès", "Tokens stakés avec succès !");
                      } else {
                        Alert.alert(
                          "Erreur",
                          stakingError || "Échec du staking"
                        );
                      }
                    }}
                    disabled={stakingLoading}
                  >
                    <Text style={styles.actionButtonText}>
                      {stakingLoading ? "Staking..." : "Staker"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Actions pour pool fermée */}
            {stakingInfo.poolClosed && (
              <View style={styles.closedPoolActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.claimButton]}
                  onPress={async () => {
                    const success = await claim();
                    if (success) {
                      Alert.alert("Succès", "Récompenses récupérées !");
                    } else {
                      Alert.alert(
                        "Erreur",
                        stakingError || "Échec de la récupération"
                      );
                    }
                  }}
                  disabled={
                    stakingLoading ||
                    parseFloat(stakingInfo.pendingRewards) === 0
                  }
                >
                  <Text style={styles.actionButtonText}>
                    {stakingLoading
                      ? "Récupération..."
                      : "Récupérer récompenses"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.withdrawButton]}
                  onPress={async () => {
                    const success = await withdraw();
                    if (success) {
                      Alert.alert("Succès", "Tokens retirés avec succès !");
                    } else {
                      Alert.alert("Erreur", stakingError || "Échec du retrait");
                    }
                  }}
                  disabled={
                    stakingLoading || parseFloat(stakingInfo.stakedAmount) === 0
                  }
                >
                  <Text style={styles.actionButtonText}>
                    {stakingLoading ? "Retrait..." : "Retirer tokens"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Erreur de staking */}
            {stakingError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{stakingError}</Text>
              </View>
            )}
          </View>
        )}

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
  stakingSection: {
    marginHorizontal: 16,
    marginVertical: 24,
    backgroundColor: "#23262f",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#363a45",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
  },
  stakingHeader: {
    marginBottom: 16,
  },
  stakingTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  stakingSubtitle: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "500",
  },
  poolInfoCard: {
    backgroundColor: "#23262f",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2c2f36",
  },
  poolInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  poolInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  poolInfoLabel: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  poolInfoValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  poolStatusContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  poolStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  poolStatusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  stakingActions: {
    marginTop: 12,
  },
  stakeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#191b22",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2c2f36",
  },
  stakeInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  stakeButton: {
    backgroundColor: "#10b981",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  claimButton: {
    backgroundColor: "#6366f1",
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  withdrawButton: {
    backgroundColor: "#ef4444",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  closedPoolActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#ef4444",
  },
  errorText: {
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
});
