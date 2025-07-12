import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useAccount } from "wagmi";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isConnected } = useAccount();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: !isConnected
          ? { display: "none" }
          : Platform.select({
              ios: {
                position: "absolute",
              },
              default: {},
            }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="star.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trading"
        options={{
          title: "Trading",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="chart.line.uptrend.xyaxis"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trading_new"
        options={{
          title: "Fan Tokens",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="trophy.fill" color={color} />
          ),
        }}
      />
      {/* Onglet League */}
      <Tabs.Screen
        name="League"
        options={{
          title: "League",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet.rectangle" color={color} />
          ),
        }}
      />
      {/* Onglet News */}
      <Tabs.Screen
        name="news"
        options={{
          title: "news",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="newspaper.fill" color={color} />
          ),
        }}
      />
      {/* Onglet Team supprimé ici */}
      {/* <Tabs.Screen
        name="Team"
        options={{
          title: "Team",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.3.fill" color={color} />
          ),
        }}
      /> */}
    </Tabs>
  );
}
