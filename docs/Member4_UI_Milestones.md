# Member 4 — UI Implementation Order & Milestones

This document is a local reference compiled directly from Section 46 of the **BLACKOUT Member 4 Implementation Playbook** in Notion.

---

## 🚀 Step-by-Step UI Implementation Phases

### Phase 1 — App Shell *(COMPLETED)*
1. `App.tsx` initialization & Theme Context provider (`Light` / `Dark` mode tokens).
2. Navigation shell (`RootNavigator.tsx` tab switcher & dynamic safe-area insets).
3. Layout primitives & shell screen views (`Home`, `Map`, `Alerts`, `Profile`, `Settings`).
4. Zero-dependency architecture isolating screens from navigation & native modules.

---

### Phase 2 — Home Screen Command Center
1. `HomeScreen.tsx` layout & emergency CTA banner.
2. Network status badge & active peer counts (`OFFLINE_LOCAL`, `DISCOVERING`, `CONNECTED`, `PROPAGATING`).
3. Incident summary cards & nearby high-severity alert teasers.
4. Resource summary indicators.

---

### Phase 3 — Emergency Reporting Flow
1. `EmergencyReportScreen.tsx` form.
2. Category selector (`FIRE`, `FLOOD`, `MEDICAL`, `TRAPPED_PERSON`, `BLOCKED_ROAD`, etc.).
3. Severity selector (`UNKNOWN`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
4. User description text input.
5. Location attachment (`GeoEngine.getCurrentLocation()`).
6. Evidence attachment (photo/media URI metadata).
7. Review & local save (`DataEngine.createReport()`).
8. Delivery state tracking (`QUEUED`, `SENT`, `PROPAGATING`, `DELIVERED`).

---

### Phase 4 — Incident List & Detail
1. `IncidentListScreen.tsx` with category/severity/confidence filters.
2. Reusable `IncidentCard` component.
3. `IncidentDetailScreen.tsx` showing full summary, first reported time, and last update.
4. Evidence gallery & confidence badges (`UNVERIFIED`, `LIKELY`, `HIGH_CONFIDENCE`, `CONFIRMED`).
5. Contradictions display & independent source counters.

---

### Phase 5 — Resource Directory
1. `ResourceScreen.tsx` with type filters (`SHELTER`, `FOOD`, `WATER`, `MEDICINE`, `MEDICAL`).
2. Resource availability badges (`AVAILABLE`, `LIMITED`, `FULL`, `CLOSED`, `UNKNOWN`).
3. Capacity indicators, location coordinates, and stale-data warnings.

---

### Phase 6 — Offline Map Integration
1. `MapScreen.tsx` loading offline MapLibre tiles.
2. Interactive map markers:
   - Current device location pin
   - Incident markers (color-coded by severity)
   - Active hazard overlays (blocked roads, fire zones)
   - Shelter/resource markers

---

### Phase 7 — Hazard-Aware Routing
1. `RouteScreen.tsx` routing UI.
2. Route calculation request (`GeoEngine.calculateRoute()`).
3. Polyline rendering for path geometry.
4. Displaying distance ($m$), estimated duration ($s$), and avoided hazard IDs.
5. Clear `NO_SAFE_ROUTE` fallback state when all paths are obstructed.

---

### Phase 8 — Native Services & Permissions
1. Runtime permission requests (Location, Bluetooth, Nearby Wi-Fi, Camera).
2. Native event subscriptions (`PEER_CONNECTED`, `MESSAGE_RECEIVED`, `LOCATION_UPDATED`).
3. Camera media capture integration.
4. Voice input with offline speech-to-text fallback.

---

### Phase 9 — Local AI Integration
1. Advisory report category suggestions (`AIEngine.classifyReport()`).
2. Duplicate incident similarity warnings (`AIEngine.detectSimilarity()`).
3. Photo evidence label suggestions (`AIEngine.analyzeEvidence()`).
4. Deterministic fallbacks when ONNX models are unavailable.

---

### Phase 10 — Full System Integration & Offline E2E Demo
1. End-to-End P2P report propagation test across physical Android phones.
2. Verifying full offline execution with internet/cellular completely disabled.
