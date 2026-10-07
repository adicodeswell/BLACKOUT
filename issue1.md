**Problem Statement**
Currently, every message in the BLACKOUT mesh uses a hardcoded Time-To-Live (TTL) of `5` hops (`NetworkMessage.java`). 
1. This is too low for `EmergencyReports`, which need to instantly saturate a 3-4 km locality to warn of immediate danger. 
2. It restricts `DirectMessages` from reaching across town quickly.
3. It is too high for `Pings`, wasting bandwidth.

**Proposed Solution**
Implement Dynamic TTLs based on `MessageType`.
* `EmergencyReport`: **TTL = 25-30** (Maximum local saturation).
* `DirectMessage`: **TTL = 15-20** (Fast intra-city routing).
* `Ping / Discovery`: **TTL = 2** (Strictly local neighbor discovery).

**Required File Changes**
* `android/app/src/main/java/com/blackout/network/protocol/NetworkMessage.java`: Remove hardcoded default `ttl=5`. Require TTL to be explicitly set or calculated in the Builder.
* `android/app/src/main/java/com/blackout/network/protocol/MessageFactory.java` (or equivalent creator): Inspect the `MessageType` enum and assign the optimal TTL before serialization.

**Expected Behavior**
The moment an emergency is logged, it will bounce up to 30 times, instantly alerting everyone within a 3-4 KM physical radius. Basic pings will stay strictly local, protecting network bandwidth.
