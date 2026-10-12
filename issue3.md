**Problem Statement: The Broadcast Storm Problem**
If we increase the TTL for Direct Messages to 15-20 hops to allow fast cross-town delivery, the current `ForwardingEngine.java` will use "Blind Flooding" (rebroadcasting 360-degrees to all connected peers). In a dense crowd, a TTL of 20 will cause an exponential broadcast storm, choking Wi-Fi Direct bandwidth, draining batteries, and crashing the mesh.

**Proposed Solution**
Implement **Geographic Routing (similar to GPSR - Greedy Perimeter Stateless Routing)** for `DIRECT` messages. 
Instead of blind-firing to all neighbors, the forwarding engine should use physical directional data. It should only forward a Direct Message to a neighbor if that neighbor is physically *closer* to the destination's last known GPS coordinate.

**Required File Changes**
* `android/app/src/main/java/com/blackout/network/reliability/ForwardingEngine.java`: Update `forwardMessage()` logic. If `messageType == DIRECT`, do not blindly call `sendManager.broadcast()`.
* `android/app/src/main/java/com/blackout/geolocation/OfflineGeoEngine.java`: Expose a method to compare neighbor distances against the intended recipient's last known coordinates.
* `ForwardingEngine` Integration: Ask `OfflineGeoEngine` for a list of peers. Filter the list to strictly those where `distance(peer, destination) < distance(self, destination)`, and only route the packet to them.

**Expected Behavior**
Direct messages will safely zip across a city (up to their TTL limit) without flooding the entire network. Bandwidth consumption will drop by an order of magnitude in dense clusters, and battery drain from redundant radio broadcasts will be eliminated.
