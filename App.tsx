import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { NativeBridgeAdapter } from "./src/adapters/native/NativeBridgeAdapter";

export default function App() {
  const [pingResult, setPingResult] = useState<string>("Pinging native bridge...");

  useEffect(() => {
    async function testNativeBridge() {
      const bridge = new NativeBridgeAdapter();
      const result = await bridge.pingNative();

      if (!result.ok) {
        console.error(result.error);
        setPingResult("Error: " + JSON.stringify(result.error));
      } else {
        console.log("BLACKOUT native ping:", result.data);
        setPingResult("BLACKOUT native bridge smoke test\nResult: " + JSON.stringify(result.data));
      }
    }

    testNativeBridge();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <View>
        <Text style={{ textAlign: "center", fontSize: 16 }}>{pingResult}</Text>
      </View>
    </SafeAreaView>
  );
}
