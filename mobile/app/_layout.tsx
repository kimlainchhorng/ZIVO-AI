import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f1120" },
          headerTintColor: "#f1f5f9",
          headerTitleStyle: { fontWeight: "600", fontSize: 17 },
          contentStyle: { backgroundColor: "#0a0b14" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
