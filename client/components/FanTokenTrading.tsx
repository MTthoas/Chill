import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAccount } from 'wagmi';
import EnhancedFanTokenTrading from './EnhancedFanTokenTrading';

interface FanTokenTradingProps {
  onTradeComplete?: (result: any) => void;
}

export default function FanTokenTrading({ onTradeComplete }: FanTokenTradingProps) {
  const { isConnected } = useAccount();
  const [showEnhanced, setShowEnhanced] = useState(true);

  const handleTradeComplete = (txHash: string) => {
    if (onTradeComplete) {
      onTradeComplete({ transactionHash: txHash });
    }
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.notConnectedContainer}>
          <Text style={styles.notConnectedText}>
            🔐 Connectez votre wallet pour accéder au trading
          </Text>
        </View>
      </View>
    );
  }

  if (showEnhanced) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowEnhanced(false)}
          >
            <Text style={styles.toggleButtonText}>
              📊 Mode Classique
            </Text>
          </TouchableOpacity>
        </View>
        <EnhancedFanTokenTrading onTradeComplete={handleTradeComplete} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowEnhanced(true)}
        >
          <Text style={styles.toggleButtonText}>
            🔐 Mode Sécurisé
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.legacyContainer}>
        <Text style={styles.legacyTitle}>📊 Mode Trading Classique</Text>
        <Text style={styles.legacyDescription}>
          Le mode classique est temporairement désactivé.{'\n'}
          Utilisez le mode sécurisé pour trader avec signature non-custodiale.
        </Text>
        
        <TouchableOpacity
          style={styles.enableSecureButton}
          onPress={() => setShowEnhanced(true)}
        >
          <Text style={styles.enableSecureButtonText}>
            🛡️ Activer le Mode Sécurisé
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notConnectedText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 26,
  },
  legacyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  legacyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  legacyDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  enableSecureButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  enableSecureButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
