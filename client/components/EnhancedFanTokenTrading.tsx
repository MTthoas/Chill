import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Address, parseEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  FAN_TOKEN_METADATA,
  SUPPORTED_CHAINS,
} from "../config/contracts";
import {
  useChilizFanTokenTradingWrite,
  useERC20Write,
  useFanTokenAllowance,
} from "../hooks/useContracts";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface EnhancedFanTokenTradingProps {
  onTradeComplete?: (txHash: string) => void;
}

export default function EnhancedFanTokenTrading({
  onTradeComplete,
}: EnhancedFanTokenTradingProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [selectedToken, setSelectedToken] = useState<string>("PSG");
  const [amount, setAmount] = useState<string>("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");

  // Check if we're on a supported Chiliz network
  const isChilizNetwork =
    chainId === SUPPORTED_CHAINS.CHILIZ_SPICY_TESTNET ||
    chainId === SUPPORTED_CHAINS.CHILIZ_MAINNET;

  // Get selected token address
  const getSelectedTokenAddress = (): Address => {
    const tokenMeta = FAN_TOKEN_METADATA.find(
      (token) => token.symbol === selectedToken
    );
    return tokenMeta?.address || FAN_TOKEN_METADATA[0].address;
  };

  const selectedTokenAddress = getSelectedTokenAddress();

  // Trading hooks
  const {
    buyFanTokens,
    sellFanTokens,
    isPending: isTradePending,
    isConfirming,
    isConfirmed,
    hash,
    error: tradeError,
  } = useChilizFanTokenTradingWrite();

  // Token approval hooks
  const { approve, isPending: isApprovePending } =
    useERC20Write(selectedTokenAddress);

  // Check allowances and balances
  const { data: allowance } = useFanTokenAllowance(
    selectedTokenAddress,
    address,
    CONTRACT_ADDRESSES.CHILIZ_FAN_TOKEN_TRADING
  );

  // Get trading info for selected token (commented out for now - you can use these later)
  // const { buyPrice, sellPrice } = useFanTokenTradingInfo(selectedTokenAddress);

  // Handle successful transaction
  React.useEffect(() => {
    if (isConfirmed && hash) {
      setAmount("");
      Alert.alert(
        "✅ Transaction Successful",
        `Transaction confirmed: ${hash}`,
        [
          {
            text: "OK",
            onPress: () => {
              if (onTradeComplete) {
                onTradeComplete(hash);
              }
            },
          },
        ]
      );
    }
  }, [isConfirmed, hash, onTradeComplete]);

  // Handle trade errors
  React.useEffect(() => {
    if (tradeError) {
      Alert.alert("Transaction Error", tradeError.message);
    }
  }, [tradeError]);

  // Check if approval is needed for selling
  const needsApproval =
    tradeType === "sell" &&
    allowance !== undefined &&
    amount &&
    parseEther(amount) > (allowance as bigint);

  // Handle buy transaction
  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      const chzAmount = parseEther(amount);
      const tokenAmount = parseEther("1"); // For now, assume 1:1 ratio, you should calculate based on price

      buyFanTokens(selectedTokenAddress, tokenAmount, chzAmount);
    } catch (error) {
      console.error("Buy error:", error);
      Alert.alert("Error", "Failed to execute buy transaction");
    }
  };

  // Handle sell transaction
  const handleSell = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      const tokenAmount = parseEther(amount);
      sellFanTokens(selectedTokenAddress, tokenAmount);
    } catch (error) {
      console.error("Sell error:", error);
      Alert.alert("Error", "Failed to execute sell transaction");
    }
  };

  // Handle approval
  const handleApprove = async () => {
    if (!amount) return;

    try {
      const tokenAmount = parseEther(amount);
      approve(CONTRACT_ADDRESSES.CHILIZ_FAN_TOKEN_TRADING, tokenAmount);
    } catch (error) {
      console.error("Approval error:", error);
      Alert.alert("Error", "Failed to approve tokens");
    }
  };

  // Handle trade execution
  const handleTrade = async () => {
    if (tradeType === "buy") {
      await handleBuy();
    } else {
      if (needsApproval) {
        await handleApprove();
      } else {
        await handleSell();
      }
    }
  };

  // Get loading state
  const isLoading = isTradePending || isConfirming || isApprovePending;

  // Get button text
  const getButtonText = () => {
    if (isLoading) return "Processing...";
    if (tradeType === "sell" && needsApproval)
      return `Approve ${selectedToken}`;
    return tradeType === "buy"
      ? `Buy ${selectedToken}`
      : `Sell ${selectedToken}`;
  };

  const renderTokenItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.tokenItem,
        { borderColor: item.color },
        selectedToken === item.symbol && { backgroundColor: `${item.color}20` },
      ]}
      onPress={() => setSelectedToken(item.symbol)}
    >
      <ThemedText style={styles.tokenEmoji}>{item.emoji}</ThemedText>
      <ThemedView style={styles.tokenInfo}>
        <ThemedText style={styles.tokenSymbol}>{item.symbol}</ThemedText>
        <ThemedText style={styles.tokenName}>{item.name}</ThemedText>
      </ThemedView>
      {selectedToken === item.symbol && (
        <ThemedText style={styles.selectedIndicator}>✓</ThemedText>
      )}
    </TouchableOpacity>
  );

  if (!isConnected) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.notConnectedContainer}>
          <ThemedText style={styles.notConnectedTitle}>
            🔐 Wallet not connected
          </ThemedText>
          <ThemedText style={styles.notConnectedText}>
            Connect your wallet to start trading fan tokens
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!isChilizNetwork) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.notConnectedContainer}>
          <ThemedText style={styles.notConnectedTitle}>
            ⚠️ Wrong Network
          </ThemedText>
          <ThemedText style={styles.notConnectedText}>
            Please switch to Chiliz network to trade fan tokens
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>🚀 Fan Token Trading</ThemedText>
        <ThemedText style={styles.subtitle}>
          Trade your favorite team tokens on Chiliz
        </ThemedText>
      </ThemedView>

      {/* Trade type selection */}
      <ThemedView style={styles.tradeTypeContainer}>
        <TouchableOpacity
          style={[
            styles.tradeTypeButton,
            tradeType === "buy" && styles.tradeTypeButtonActive,
          ]}
          onPress={() => setTradeType("buy")}
        >
          <ThemedText
            style={[
              styles.tradeTypeText,
              tradeType === "buy" && styles.tradeTypeTextActive,
            ]}
          >
            📈 BUY
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tradeTypeButton,
            tradeType === "sell" && styles.tradeTypeButtonActive,
          ]}
          onPress={() => setTradeType("sell")}
        >
          <ThemedText
            style={[
              styles.tradeTypeText,
              tradeType === "sell" && styles.tradeTypeTextActive,
            ]}
          >
            📉 SELL
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Token selection */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          ⚽ Select a Fan Token
        </ThemedText>
        <FlatList
          data={[...FAN_TOKEN_METADATA]}
          renderItem={renderTokenItem}
          keyExtractor={(item) => item.symbol}
          style={styles.tokenList}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>

      {/* Amount input */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          💰 Amount ({tradeType === "buy" ? "CHZ" : selectedToken})
        </ThemedText>
        <TextInput
          style={styles.amountInput}
          placeholder={`Enter amount in ${
            tradeType === "buy" ? "CHZ" : selectedToken
          }`}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </ThemedView>

      {/* Trading button */}
      <TouchableOpacity
        style={[styles.tradeButton, { opacity: isLoading ? 0.7 : 1 }]}
        onPress={handleTrade}
        disabled={isLoading || !amount}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <ThemedText style={styles.tradeButtonText}>
            {getButtonText()}
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* Transaction status */}
      {isConfirming && (
        <ThemedView style={styles.statusContainer}>
          <ActivityIndicator color="#10B981" />
          <ThemedText style={styles.statusText}>
            Confirming transaction...
          </ThemedText>
        </ThemedView>
      )}

      {/* Security info */}
      <ThemedView style={styles.securityInfo}>
        <ThemedText style={styles.securityTitle}>
          🛡️ Security Guaranteed
        </ThemedText>
        <ThemedText style={styles.securityText}>
          • You maintain full control of your keys{"\n"}• Each transaction must
          be signed by you{"\n"}• No sensitive data is stored{"\n"}• Verifiable
          source code on blockchain
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  tradeTypeContainer: {
    flexDirection: "row",
    marginBottom: 25,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 4,
  },
  tradeTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  tradeTypeButtonActive: {
    backgroundColor: "#6366F1",
  },
  tradeTypeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  tradeTypeTextActive: {
    color: "#FFF",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 12,
  },
  tokenList: {
    maxHeight: 200,
  },
  tokenItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  tokenEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
  tokenName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  selectedIndicator: {
    fontSize: 20,
    color: "#10B981",
  },
  amountInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFF",
  },
  tradeButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  tradeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  securityInfo: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  securityText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 18,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  statusText: {
    fontSize: 16,
    color: "#10B981",
    marginLeft: 12,
    fontWeight: "600",
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  notConnectedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 16,
    textAlign: "center",
  },
  notConnectedText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 24,
  },
});
