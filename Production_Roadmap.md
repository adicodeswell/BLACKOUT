# BLACKOUT | Production Roadmap & Gap Analysis

## Current State Analysis (Gaps & Mocks)
The frontend UI is fully functional and connected to the React Native bridge, but the application relies on several mock implementations and bypassed native layers to run in a simulator/development environment. To achieve a production-grade mesh network app, we must implement the hardware-level APIs.

**Key Findings:**
1. **Network Engine is Stubbed:** In `BlackoutNativeModule.java`, we are currently passing `null` to `BleDiscoveryEngine` and `WifiDirectManager`. This completely bypasses physical peer discovery.
2. **Geo Engine is entirely Mocked:** The frontend unconditionally uses `DevGeoEngine`, hardcoding the location to San Francisco and rendering mock hazard zones. The Native `GeoEngine` does not exist yet.
3. **Security is Bypassed:** Direct messaging currently saves and forwards plain text. End-to-end encryption is not yet implemented.

---

## Chronological Implementation Plan

### Phase 1: Physical Mesh Networking (Member 1)
*Remove network mocks and connect devices over physical radios.*
1. **Hardware Injections:** Modify `BlackoutNativeModule.java` to extract the real `BluetoothAdapter`, `WifiP2pManager`, and `Channel` from Android context, and inject them into `BleDiscoveryEngine` and `WifiDirectManager`.
2. **Wi-Fi Direct Handshake:** Implement a `BroadcastReceiver` to handle `WIFI_P2P_PEERS_CHANGED_ACTION`, discover peers, and automatically negotiate Group Owners to establish persistent TCP Sockets.
3. **Anti-Entropy Sync:** Implement a background Gossip protocol so connected peers automatically diff and sync their Room databases (Incidents/Resources) without manual user intervention.
4. **E2E Encryption:** Generate RSA/Curve25519 keypairs on device initialization and encrypt `DIRECT` messages payload before transmission.

### Phase 2: Offline Geospatial Engine (Member 3)
*Replace DevGeoEngine with a fully native offline routing and mapping layer.*
1. **Native Module Creation:** Create `BlackoutGeoModule.java` and expose `GeoEngineAdapter.ts` to replace `DevGeoEngine`.
2. **Real-Time GPS:** Integrate Android `FusedLocationProviderClient` to fetch real device coordinates instead of the hardcoded San Francisco coordinates.
3. **Offline Tile Storage:** Implement logic to cache/download MapLibre vector tiles to the local device storage for offline rendering.
4. **A* Spatial Routing:** Integrate an offline routing algorithm (using SpatiaLite or an on-device Graph representation) to calculate paths around dynamic hazard zones (fires, blockages).

### Phase 3: Frontend Integration & Polish (Member 4)
*Remove the remaining hardcoded UI logic and implement media.*
1. **Camera & Evidence Integration:** Integrate `react-native-image-picker` in `EmergencyReportScreen` to capture photos, compress them natively, and save them as `EvidenceDto`.
2. **Dynamic Profile Stats:** Remove hardcoded text like `"Local Device Initialization"` in `ProfileScreen` and compute real network lifetime statistics.
3. **Foreground Service:** Connect the React Native app lifecycle to an Android Foreground Service so the Mesh Network stays alive even when the app is minimized or the screen is off.

### Phase 4: Production & Field Testing
1. **Multi-Node Physical Test:** Deploy to 3+ Android devices to verify multi-hop routing, BLE battery drain, and WiFi Direct stability.
2. **ProGuard/R8 Rules:** Configure minification and obfuscation rules for the production APK.
