import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#fff" },
        presentation: "card",
        animation: "default",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F3F4F6" },
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F0F0F5" },
        }}
      />
    </Stack>
  );
}
