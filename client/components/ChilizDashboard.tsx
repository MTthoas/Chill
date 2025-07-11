import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import FanTokenTrading from './FanTokenTrading';
import FanTokenPortfolio from './FanTokenPortfolio';

type TabType = 'trading' | 'portfolio';

export default function ChilizDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trading':
        return <FanTokenTrading onTradeComplete={() => {
          // Optionnel: basculer vers le portfolio après un trade
          // setActiveTab('portfolio');
        }} />;
      case 'portfolio':
        return <FanTokenPortfolio onTokenPress={() => {
          // Optionnel: basculer vers le trading quand on clique sur un token
          setActiveTab('trading');
        }} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'portfolio' && styles.activeTab]}
          onPress={() => setActiveTab('portfolio')}
        >
          <Text style={[styles.tabText, activeTab === 'portfolio' && styles.activeTabText]}>
            Portfolio
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trading' && styles.activeTab]}
          onPress={() => setActiveTab('trading')}
        >
          <Text style={[styles.tabText, activeTab === 'trading' && styles.activeTabText]}>
            Trading
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#0066CC',
  },
  content: {
    flex: 1,
  },
});
