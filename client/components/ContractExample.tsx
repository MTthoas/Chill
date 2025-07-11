import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CHAIN_IDS } from "../contracts/config";
import { useContracts } from "../hooks/useContracts";

export default function ContractExample() {
  const {
    walletInfo,
    isConnecting,
    isConnected,
    intents,
    isLoading,
    error,
    currentPrice,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    createIntent,
    cancelIntent,
    refreshIntents,
    refreshPrice,
  } = useContracts();

  // Form state for creating intents
  const [intentForm, setIntentForm] = useState({
    type: "swap" as "swap" | "bridge" | "advanced",
    amount: "",
    triggerPrice: "",
    fromToken: "ETH",
    toToken: "USDC",
    toChain: CHAIN_IDS.BASE_SEPOLIA,
  });

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      Alert.alert("Success", "Wallet connected successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      await switchNetwork(chainId);
      Alert.alert("Success", "Network switched successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleCreateIntent = async () => {
    try {
      if (!intentForm.amount) {
        Alert.alert("Error", "Please enter an amount");
        return;
      }

      const txHash = await createIntent({
        type: intentForm.type,
        amount: intentForm.amount,
        triggerPrice: intentForm.triggerPrice || undefined,
        fromToken: intentForm.fromToken,
        toToken: intentForm.toToken,
        fromChain: walletInfo?.chainId || CHAIN_IDS.ETHEREUM_SEPOLIA,
        toChain: intentForm.type === "bridge" ? intentForm.toChain : undefined,
      });

      Alert.alert(
        "Success",
        `Intent created! Transaction: ${txHash.slice(0, 10)}...`
      );

      // Reset form
      setIntentForm({
        ...intentForm,
        amount: "",
        triggerPrice: "",
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleCancelIntent = async (intentId: string) => {
    try {
      const txHash = await cancelIntent(intentId);
      Alert.alert(
        "Success",
        `Intent canceled! Transaction: ${txHash.slice(0, 10)}...`
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>IntentFi Contract Interface</Text>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Wallet Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet</Text>

        {!isConnected ? (
          <TouchableOpacity
            style={styles.button}
            onPress={handleConnectWallet}
            disabled={isConnecting}
          >
            <Text style={styles.buttonText}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View>
            <Text style={styles.info}>
              Address: {walletInfo?.address?.slice(0, 10)}...
            </Text>
            <Text style={styles.info}>Chain ID: {walletInfo?.chainId}</Text>

            <TouchableOpacity style={styles.button} onPress={disconnectWallet}>
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Network Switching */}
      {isConnected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Switch Network</Text>

          <View style={styles.networkButtons}>
            <TouchableOpacity
              style={[
                styles.smallButton,
                walletInfo?.chainId === CHAIN_IDS.ETHEREUM_SEPOLIA &&
                  styles.activeButton,
              ]}
              onPress={() => handleSwitchNetwork(CHAIN_IDS.ETHEREUM_SEPOLIA)}
            >
              <Text style={styles.smallButtonText}>Ethereum</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.smallButton,
                walletInfo?.chainId === CHAIN_IDS.BASE_SEPOLIA &&
                  styles.activeButton,
              ]}
              onPress={() => handleSwitchNetwork(CHAIN_IDS.BASE_SEPOLIA)}
            >
              <Text style={styles.smallButtonText}>Base</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.smallButton,
                walletInfo?.chainId === CHAIN_IDS.FLOW_TESTNET &&
                  styles.activeButton,
              ]}
              onPress={() => handleSwitchNetwork(CHAIN_IDS.FLOW_TESTNET)}
            >
              <Text style={styles.smallButtonText}>Flow</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Price Display */}
      {isConnected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Price</Text>
          <Text style={styles.info}>
            {currentPrice ? `$${currentPrice}` : "Loading..."}
          </Text>
          <TouchableOpacity style={styles.smallButton} onPress={refreshPrice}>
            <Text style={styles.smallButtonText}>Refresh Price</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Intent Form */}
      {isConnected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Intent</Text>

          {/* Intent Type */}
          <Text style={styles.label}>Intent Type:</Text>
          <View style={styles.segmentedControl}>
            {["swap", "bridge", "advanced"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.segment,
                  intentForm.type === type && styles.activeSegment,
                ]}
                onPress={() =>
                  setIntentForm({ ...intentForm, type: type as any })
                }
              >
                <Text
                  style={[
                    styles.segmentText,
                    intentForm.type === type && styles.activeSegmentText,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Text style={styles.label}>Amount:</Text>
          <TextInput
            style={styles.input}
            value={intentForm.amount}
            onChangeText={(text) =>
              setIntentForm({ ...intentForm, amount: text })
            }
            placeholder="Enter amount (e.g., 0.1)"
            keyboardType="numeric"
          />

          {/* Trigger Price (Optional) */}
          <Text style={styles.label}>Trigger Price (Optional):</Text>
          <TextInput
            style={styles.input}
            value={intentForm.triggerPrice}
            onChangeText={(text) =>
              setIntentForm({ ...intentForm, triggerPrice: text })
            }
            placeholder="Enter trigger price (e.g., 2000)"
            keyboardType="numeric"
          />

          {/* From Token */}
          <Text style={styles.label}>From Token:</Text>
          <TextInput
            style={styles.input}
            value={intentForm.fromToken}
            onChangeText={(text) =>
              setIntentForm({ ...intentForm, fromToken: text })
            }
            placeholder="Token symbol (e.g., ETH)"
          />

          {/* To Token (for swaps) */}
          {intentForm.type === "swap" && (
            <>
              <Text style={styles.label}>To Token:</Text>
              <TextInput
                style={styles.input}
                value={intentForm.toToken}
                onChangeText={(text) =>
                  setIntentForm({ ...intentForm, toToken: text })
                }
                placeholder="Token symbol (e.g., USDC)"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleCreateIntent}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Creating..." : "Create Intent"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* User Intents */}
      {isConnected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Intents</Text>

          <TouchableOpacity style={styles.smallButton} onPress={refreshIntents}>
            <Text style={styles.smallButtonText}>Refresh Intents</Text>
          </TouchableOpacity>

          {intents.length === 0 ? (
            <Text style={styles.info}>No intents found</Text>
          ) : (
            intents.map((intent, index) => (
              <View key={intent.id.toString()} style={styles.intentCard}>
                <Text style={styles.intentText}>
                  ID: {intent.id.toString()}
                </Text>
                <Text style={styles.intentText}>
                  Type: {intent.intentType.toString()}
                </Text>
                <Text style={styles.intentText}>
                  Amount: {intent.amount.toString()}
                </Text>
                <Text style={styles.intentText}>
                  Status: {intent.status.toString()}
                </Text>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelIntent(intent.id.toString())}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  smallButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginVertical: 3,
    marginHorizontal: 2,
  },
  smallButtonText: {
    color: "#333",
    fontSize: 14,
  },
  activeButton: {
    backgroundColor: "#007AFF",
  },
  networkButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  info: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    padding: 2,
  },
  segment: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderRadius: 4,
  },
  activeSegment: {
    backgroundColor: "#007AFF",
  },
  segmentText: {
    fontSize: 14,
    color: "#666",
  },
  activeSegmentText: {
    color: "white",
    fontWeight: "600",
  },
  intentCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 6,
    marginVertical: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  intentText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  cancelButton: {
    backgroundColor: "#ff3b30",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 5,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
