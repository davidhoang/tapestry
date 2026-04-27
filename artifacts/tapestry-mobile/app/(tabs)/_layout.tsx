import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR } from "@/constants/chrome";
import { useColors } from "@/hooks/useColors";

const NATIVE_GLASS =
  Platform.OS === "ios" &&
  typeof isLiquidGlassAvailable === "function" &&
  isLiquidGlassAvailable();

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: "CrimsonText_600SemiBold",
          fontSize: 11,
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarStyle: {
          position: "absolute",
          left: TAB_BAR.marginHorizontal,
          right: TAB_BAR.marginHorizontal,
          bottom: insets.bottom + TAB_BAR.marginBottom,
          height: TAB_BAR.height,
          borderRadius: TAB_BAR.radius,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
          shadowColor: "#1A1612",
          shadowOpacity: isDark ? 0.4 : 0.14,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          // Allow the shadow to escape; the rounded glass surface is clipped
          // by the inner background view instead.
          overflow: "visible",
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: TAB_BAR.radius, overflow: "hidden" },
            ]}
          >
            {NATIVE_GLASS ? (
              <GlassView
                style={StyleSheet.absoluteFill}
                glassEffectStyle="regular"
                tintColor={colors.glassTint}
              />
            ) : (
              <>
                <BlurView
                  intensity={70}
                  tint={isDark ? "dark" : "light"}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: colors.glassTintFallback },
                  ]}
                />
              </>
            )}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  pointerEvents: "none",
                  borderRadius: TAB_BAR.radius,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.glassBorder,
                },
              ]}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="designers"
        options={{
          title: "Designers",
          tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: "Lists",
          tabBarIcon: ({ color }) => <Feather name="bookmark" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
