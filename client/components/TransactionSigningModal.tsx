import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface TransactionSigningModalProps {
  isVisible: boolean;
  onClose: () => void;
  transactionData: {
    type: 'buy' | 'sell';
    tokenSymbol: string;
    amount: string;
    estimatedPrice: string;
    gasEstimate: string;
  } | null;
  onSign: () => Promise<void>;
  isLoading: boolean;
}

export default function TransactionSigningModal({
  isVisible,
  onClose,
  transactionData,
  onSign,
  isLoading,
}: TransactionSigningModalProps) {
  const [step, setStep] = useState<'review' | 'signing' | 'broadcasting'>('review');

  if (!transactionData) return null;

  const handleSign = async () => {
    try {
      setStep('signing');
      await onSign();
      setStep('broadcasting');
    } catch {
      setStep('review');
      Alert.alert('Erreur', 'Échec de la signature de la transaction');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'review':
        return (
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              🔐 Confirmez votre transaction
            </ThemedText>
            
            <ThemedView style={styles.transactionDetails}>
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Type:</ThemedText>
                <ThemedText style={[styles.detailValue, { 
                  color: transactionData.type === 'buy' ? '#10B981' : '#EF4444' 
                }]}>
                  {transactionData.type === 'buy' ? '📈 ACHAT' : '📉 VENTE'}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Token:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {transactionData.tokenSymbol}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Quantité:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {transactionData.amount}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Prix estimé:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {transactionData.estimatedPrice} CHZ
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Frais de gaz:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  ~{transactionData.gasEstimate} CHZ
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.securityInfo}>
              <ThemedText style={styles.securityTitle}>
                🛡️ Sécurité maximale
              </ThemedText>
              <ThemedText style={styles.securityText}>
                • Vos clés privées restent dans votre wallet{'\n'}
                • Vous signez la transaction vous-même{'\n'}
                • Aucune donnée sensible n&apos;est stockée
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.signButton}
                onPress={handleSign}
                disabled={isLoading}
              >
                <ThemedText style={styles.signButtonText}>
                  🔐 Signer avec mon wallet
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        );

      case 'signing':
        return (
          <ThemedView style={styles.modalContent}>
            <ActivityIndicator size="large" color="#6366F1" />
            <ThemedText style={styles.loadingTitle}>
              ✍️ Signature en cours...
            </ThemedText>
            <ThemedText style={styles.loadingText}>
              Veuillez confirmer la transaction dans votre wallet
            </ThemedText>
            
            <ThemedView style={styles.instructionsBox}>
              <ThemedText style={styles.instructionsTitle}>
                📱 Instructions:
              </ThemedText>
              <ThemedText style={styles.instructionsText}>
                1. Ouvrez votre application wallet{'\n'}
                2. Vérifiez les détails de la transaction{'\n'}
                3. Appuyez sur &quot;Confirmer&quot; pour signer
              </ThemedText>
            </ThemedView>
          </ThemedView>
        );

      case 'broadcasting':
        return (
          <ThemedView style={styles.modalContent}>
            <ActivityIndicator size="large" color="#10B981" />
            <ThemedText style={styles.loadingTitle}>
              📡 Diffusion sur la blockchain...
            </ThemedText>
            <ThemedText style={styles.loadingText}>
              Votre transaction est en cours de traitement
            </ThemedText>
            
            <ThemedView style={styles.processingInfo}>
              <ThemedText style={styles.processingText}>
                ⏱️ Temps estimé: 30-60 secondes{'\n'}
                🔗 Réseau: Chiliz Blockchain{'\n'}
                ✅ Transaction signée et sécurisée
              </ThemedText>
            </ThemedView>
          </ThemedView>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  transactionDetails: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  securityInfo: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  signButton: {
    flex: 2,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionsBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  processingInfo: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  processingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    textAlign: 'center',
  },
});
