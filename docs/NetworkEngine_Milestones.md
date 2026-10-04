# Purpose
This page is the complete chronological implementation playbook for **Member 1 — Network Engine**.
It is based on the already-frozen BLACKOUT contracts and adapter architecture. Do not redesign the public TypeScript API while implementing Java.
Target runtime path:
React Native UI
→ NetworkEngineAdapter.ts
→ BlackoutNativeBridge.ts
→ `BlackoutNativeModule.java`
→ `AndroidNetworkEngine.java`
→ discovery / connections / protocol / reliability
→ DataEngine / Room
Read these existing pages first:
- BLACKOUT \| API Contracts & Module Interfaces — canonical contracts and adapter boundary.
- BLACKOUT \| Deliverables for NET, DATA and GEO — NET ownership, file responsibilities, bridge ownership, integration and testing.
- BLACKOUT \| Technology Stack — platform decisions.
- BLACKOUT \| Security Architecture — security requirements.
- BLACKOUT \| Testing Strategy — physical-device and offline tests.
- Day 0: Before Everyone Starts — repository and bridge baseline.
> [!IMPORTANT]
> 
	Do not implement BLE, Wi-Fi Direct, forwarding, ACK, persistence and React Native integration simultaneously. First finish a complete two-phone vertical slice: TCP connection → BLACKOUT handshake → valid message → ACK. Then add queueing, deduplication, TTL, forwarding, discovery, persistence, lifecycle and UI integration.

---

# 1. Existing Contract — Frozen Reference

The existing network contract files are:
src/contracts/network/
- MessageDto.ts
- PeerDto.ts
- NetworkEngine.ts
- NetworkEvents.ts
The existing adapters are:
src/adapters/
- native/BlackoutNativeBridge.ts
- native/NativeBridgeAdapter.ts
- network/NetworkEngineAdapter.ts
The existing native bridge is:
android/app/src/main/java/com/blackout/bridge/
- `BlackoutNativeModule.java`
- `BlackoutPackage.java`
The runtime boundary is:
React Native


# 2. Implementation Phases

The 40 implementation milestones naturally group into **8 major phases**:

| Phase                                               | Milestones      | What you build                                                                                                 |
| --------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| **Phase 1 — Foundation & Protocol**                 | NET-01 → NET-05 | Verify contracts, Java models, `NetworkMessage`, serialization, validation                                     |
| **Phase 2 — Transport Layer**                       | NET-06 → NET-09 | TCP framing, server, connection manager, peer connections                                                      |
| **Phase 3 — BLACKOUT Handshake & Direct Messaging** | NET-10 → NET-14 | Handshake, first physical test, receive pipeline, message handler, outgoing send                               |
| **Phase 4 — Reliability & Store-and-Forward**       | NET-15 → NET-21 | Queue, DATA integration, deduplication, TTL, forwarding, ACK, retry                                            |
| **Phase 5 — Peer Discovery & Android Networking**   | NET-22 → NET-28 | Discovery manager, BLE, Wi-Fi Direct, device identity, foreground service, permissions, `AndroidNetworkEngine` |
| **Phase 6 — React Native Integration**              | NET-29 → NET-32 | Native bridge, RN adapter, events, error mapping                                                               |
| **Phase 7 — Physical Network Validation**           | NET-33 → NET-37 | Two-phone, duplicate, TTL, three-phone mesh, restart/queue, malformed input, internet-off testing              |
| **Phase 8 — Full System Integration**               | NET-38 → NET-40 | DATA integration, GEO integration, complete offline E2E                                                        |

### The dependency flow

```text
PHASE 1
Foundation / Protocol
        ↓
PHASE 2
TCP Transport
        ↓
PHASE 3
Handshake + Direct Messaging
        ↓
PHASE 4
Reliability + Mesh
        ↓
PHASE 5
BLE + Wi-Fi Direct + Android Lifecycle
        ↓
PHASE 6
React Native Bridge
        ↓
PHASE 7
Physical Device Validation
        ↓
PHASE 8
DATA + GEO + Full E2E
```

### Most important boundary

Your page explicitly makes **NET-02 → NET-11** the first real coding block:

```text
Java models
   ↓
Serialization
   ↓
Validation
   ↓
TCP framing
   ↓
TCP server
   ↓
ConnectionManager
   ↓
PeerConnection
   ↓
BLACKOUT handshake
   ↓
Two physical phones successfully communicate
```

So **you should not start BLE, Wi-Fi Direct, forwarding, or mesh routing yet**.

The first meaningful checkpoint is:

```text
Phone A  ←→  Phone B

HELLO
HELLO_ACK
CAPABILITIES
CAPABILITIES_ACK
REPORT
ACK
```

with **no internet required**.

It means **NET should first prove that two phones can communicate directly using the basic TCP/network layer**, before adding the harder networking features.

### In simple terms

You first build:

1. **Java models** — define what a BLACKOUT message looks like.
2. **Serialization/validation** — convert messages to/from bytes and reject invalid ones.
3. **TCP communication** — Phone A can connect directly to Phone B.
4. **ConnectionManager/PeerConnection** — manage that connection.
5. **Handshake** — both phones introduce themselves and confirm they understand each other.
6. **Send a test report + ACK** — A sends a message, B receives it and confirms receipt.

So your first success test should literally be:

```text
Phone A                         Phone B

   HELLO -------------------->
        <---------------- HELLO_ACK

   CAPABILITIES -------------->
        <---------- CAPABILITIES_ACK

   REPORT -------------------->
        <---------------- ACK
```

**No BLE, no Wi-Fi Direct discovery, no forwarding, no 3-phone mesh yet.**

Once this works between **two physical phones with the internet turned off**, you have a solid foundation for the later networking phases.


# 53. Definition of Done — Individual File

A file is not done because it compiles.
For each file:

- [ ] correct package;

- [ ] correct ownership;

- [ ] clear public methods;

- [ ] no duplicated TypeScript contract;

- [ ] no UI logic;

- [ ] no unrelated module logic;

- [ ] input validation;

- [ ] controlled errors;

- [ ] thread-safety considered;

- [ ] lifecycle behavior defined;

- [ ] unit tests where applicable;

- [ ] physical testing where hardware/network dependent;

- [ ] useful debugging logs.
---

# 54. Definition of Done — Network Engine

The Network Engine is complete only when:

- [ ] contracts compile;

- [ ] adapters compile;

- [ ] native bridge integration works;

- [ ] stable device identity works;

- [ ] peer discovery works;

- [ ] Wi-Fi Direct connectivity works;

- [ ] TCP connection works;

- [ ] handshake works;

- [ ] capabilities exchange works;

- [ ] framing works;

- [ ] serialization works;

- [ ] validation works;

- [ ] direct messages work;

- [ ] ACK works;

- [ ] delivery status works;

- [ ] queue works;

- [ ] queue survives restart;

- [ ] deduplication works;

- [ ] TTL works;

- [ ] forwarding works;

- [ ] three-phone A→B→C works;

- [ ] malformed input cannot crash the app;

- [ ] connection loss is recoverable;

- [ ] internet is not required;

- [ ] DATA integration works;

- [ ] full offline E2E works.
---

# 55. Git Strategy

Recommended branches:
main
- feature/network-protocol
- feature/network-transport
- feature/network-reliability
- feature/network-discovery
Good commit examples:
- feat(network): add protocol message model
- feat(network): add message serializer
- feat(network): add frame reader and writer
- feat(network): add peer connection
- feat(network): add blackout handshake
- feat(network): add outgoing queue
- feat(network): add message deduplication
- feat(network): add ttl forwarding
- feat(network): add ack manager
- feat(network): add wifi direct discovery
- feat(bridge): expose network start
- test(network): add malformed frame tests
- test(network): add multi-hop forwarding test
Avoid one giant "complete network engine" commit.
---

# 56. Shared Bridge Conflict Rule

Shared file:
android/app/src/main/java/com/blackout/bridge/`BlackoutNativeModule.java`
Before modifying:
1. Pull/rebase latest shared changes.
2. Check whether another member is editing it.
3. Announce the bridge change.
4. Make the smallest possible change.
5. Commit separately.
6. Push.
7. Notify the consumer.
8. Rebase before continuing.
Never create a duplicate native module to avoid a merge conflict.
---

# 57. What NET Must Never Own

NET owns:
- peer discovery;
- peer connections;
- protocol;
- message transport;
- queue;
- deduplication;
- TTL;
- forwarding;
- ACK/retry;
- network lifecycle.
NET does not own:
- Room SQL;
- incident aggregation;
- confidence calculation;
- A\*;
- map rendering;
- React Native screens;
- AI inference;
- emergency-report form logic;
- notification rendering.
---

# 58. First Vertical Slice — Immediate Coding Target

Before BLE or mesh forwarding, make this work on two physical Android phones:
Phone A
→ NetworkEngine.send()
→ NetworkEngineAdapter
→ native bridge
→ AndroidNetworkEngine
→ PeerConnection
→ TCP
→ Phone B
→ MessageFramer
→ MessageSerializer
→ MessageValidator
→ MessageHandler
→ ACK
→ Phone A
Acceptance:
A → HELLO → B
A ← HELLO_ACK ← B
A → CAPABILITIES → B
A ← CAPABILITIES_ACK ← B
A → REPORT → B
A ← ACK ← B
**Only after this is proven should multi-hop networking begin.**
---

# 59. Final Architecture

React Native
→ NetworkEngineAdapter.ts
→ BlackoutNativeBridge.ts
→ `BlackoutNativeModule.java`
→ AndroidNetworkEngine
→ Discovery / Connection / Reliability
→ PeerConnection
→ TCP
→ BLACKOUT Protocol
→ DataEngine
→ Room
Discovery consists of:
BLE
-
Wi-Fi Direct
Reliability consists of:
Queue
-
Deduplication
-
TTL
-
Forwarding
-
ACK
-
Retry
> [!IMPORTANT]
> 
	**Your first real coding target is NET-02 through NET-11.** The first success condition is not "`AndroidNetworkEngine.java` exists." It is "two physical Android phones establish a BLACKOUT handshake and exchange a valid protocol message without internet."

# 60. Reference Pages

Use these existing pages as supporting documentation:
- BLACKOUT \| API Contracts & Module Interfaces
- BLACKOUT \| Deliverables for NET, DATA and GEO
- BLACKOUT \| Technology Stack
- BLACKOUT \| Security Architecture
- BLACKOUT \| Testing Strategy
- Day 0: Before Everyone Starts
