**Problem Statement: The "Newcomer" Problem**
Currently, the network relies entirely on immediate "Push" routing via TTL limits. If an emergency occurs at 1:00 PM, the shockwave of messages will expire after hitting their max hops. If a new user drives into the city at 2:00 PM, they will never receive the emergency alerts because no one is actively forwarding them anymore.

**Proposed Solution**
Implement an **Epidemic Anti-Entropy Sync Protocol** (Gossip protocol). This shifts the network from just "Pushing" to also "Pulling".
When two nodes physically connect, they perform a background handshake to exchange "Summary Vectors" (e.g., the timestamp of their newest message). The node with older data pulls the missing `NetworkMessageEntity` and `IncidentEntity` records directly from the peer's Room Database.

**New Files & Changes**
* `android/app/src/main/java/com/blackout/network/reliability/AntiEntropyEngine.java` (New): Manages the state reconciliation logic (comparing timestamps/Merkle trees) and requesting missing message IDs.
* `android/app/src/main/java/com/blackout/data/RoomDataEngine.java`: Add queries like `getMessagesSince(long timestamp)` and `getMissingMessageIds(List<String> knownIds)`.
* `android/app/src/main/java/com/blackout/network/ConnectionManager.java` (or similar transport layer): Attach an event listener so the moment a BLE/Wi-Fi Direct handshake succeeds, it invokes the `AntiEntropyEngine`.

**Expected Behavior**
The TTL is no longer the limit for distance. A message can travel infinitely across 4-5 connected cities. As cars and people move between localities, their phones silently trade databases in the background, achieving *Eventual Consistency* across the entire decentralized mesh.
