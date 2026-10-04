# BLACKOUT — GEO Engine

## Member 3 — Offline Geolocation, Mapping and Routing

The `geolocation` package is the offline GEO engine of the BLACKOUT application.

Its responsibility is to provide:

* offline GPS/GNSS location acquisition
* location validation
* geographic distance calculations
* offline road-map management
* directed road-graph representation
* A* route calculation
* dynamic hazard projection
* hazard-aware rerouting
* nearby-location search
* route reconstruction
* coordination of the GEO components through `OfflineGeoEngine`

The GEO engine is designed to work without:

* Google Maps
* Google Directions API
* internet-based routing
* cloud routing services
* remote Places APIs
* backend routing dependencies

The engine consumes canonical application contracts such as `LocationDto`, `HazardDto`, `RouteDto`, and `RouteOptions`.

---

# 1. GEO Architecture

The overall architecture is:

```text
React Native UI
       |
       v
GeoEngineAdapter.ts
       |
       v
BlackoutNativeBridge
       |
       v
BlackoutNativeModule
       |
       v
OfflineGeoEngine
       |
       +-------------------------+
       |                         |
       v                         v
LocationProvider          OfflineMapManager
       |                         |
       v                         v
LocationValidator            RoadGraph
                                 |
                                 v
                         HazardProjector
                                 |
                                 v
                            AStarRouter
                                 |
                                 v
                            RouteResult
```

The GEO package contains the actual geospatial and routing logic.

The React Native bridge should remain thin and should not contain graph algorithms, GPS state management, OSM processing, or hazard mathematics.

---

# 2. Directory Structure

```text
geolocation/
│
├── OfflineGeoEngine.java
├── AndroidLocationProvider.java
├── LocationValidator.java
├── OfflineMapManager.java
├── RoadGraph.java
├── GraphNode.java
├── GraphEdge.java
├── HazardProjector.java
├── AStarRouter.java
├── RouteResult.java
├── DistanceCalculator.java
├── NearbySearch.java
│
├── model/
│   ├── GeoPoint.java
│   ├── MapRegionInternal.java
│   ├── HazardState.java
│   └── RouteComputation.java
│
└── source/
    ├── OfflineMapSource.java
    ├── BundledMapSource.java
    └── LocalMapCache.java
```

---

# 3. Core Classes

## 3.1 OfflineGeoEngine.java

### Purpose

`OfflineGeoEngine` is the main GEO facade.

It coordinates all GEO components instead of putting all logic into one large class.

### Responsibilities

It coordinates operations such as:

```text
getCurrentLocation()
loadOfflineMap()
calculateRoute()
calculateDistance()
findNearby()
```

For routing, the conceptual flow is:

```text
Origin + Destination
        |
        v
Validate input
        |
        v
Ensure map region is available
        |
        v
Find nearest graph nodes
        |
        v
Apply active hazards
        |
        v
Run A*
        |
        v
Build RouteResult
        |
        v
Return canonical RouteDto
```

### Important design principle

`OfflineGeoEngine` is an orchestrator.

It should not contain the complete implementation of:

* A*
* GPS acquisition
* graph storage
* hazard projection
* distance mathematics

Those responsibilities belong to dedicated classes.

---

# 4. AndroidLocationProvider.java

## Purpose

Provides the device's physical location using Android's GPS provider.

The offline implementation uses:

```text
LocationManager
       |
       v
GPS_PROVIDER
       |
       v
Android Location
       |
       v
LocationDto
```

GPS does not require an internet connection.

However, obtaining a GPS fix can take longer when the device has no network assistance.

## Responsibilities

* check whether GPS is available
* request location updates
* receive Android `Location` objects
* convert them to `LocationDto`
* stop/remove listeners when observation ends
* distinguish unavailable/no-fix conditions

This class is Android-specific.

Therefore, it is separated from the pure Java routing classes.

---

# 5. LocationValidator.java

## Purpose

Validates GPS coordinates before they are accepted by GEO.

Validation includes:

1. latitude range
2. longitude range
3. finite numeric values
4. timestamp validity
5. location freshness
6. accuracy threshold

A stale or inaccurate location must not silently become a valid location.

## Example

```text
Android Location
       |
       v
LocationValidator
       |
       +---- valid ----> GEO
       |
       +---- stale ----> explicit failure
       |
       +---- inaccurate -> explicit failure
       |
       +---- invalid ---> explicit failure
```

Validation thresholds should be centralized rather than scattered throughout the code.

---

# 6. DistanceCalculator.java

## Purpose

Provides pure geographic distance calculations.

The main calculation uses the Haversine formula.

The Haversine formula calculates the great-circle distance between two points on Earth.

Conceptually:

```text
Point A
(latitude, longitude)
       |
       | Haversine
       v
distance in metres
       ^
       |
Point B
(latitude, longitude)
```

## Why it is important

The distance calculation is reused by:

* A* heuristic calculation
* nearest-node selection
* hazard proximity calculations
* nearby search
* route distance calculations

The same Earth-radius constant should be used consistently.

---

# 7. model/GeoPoint.java

## Purpose

Represents a geographic coordinate internally.

Typical data:

```text
latitude
longitude
```

It is intentionally simpler than the application-level `LocationDto`.

`GeoPoint` is an internal GEO model.

`LocationDto` is a canonical application contract.

---

# 8. model/MapRegionInternal.java

## Purpose

Represents the internal version of a geographic map region.

It contains:

```text
minLatitude
minLongitude
maxLatitude
maxLongitude
```

It is used for:

* region validation
* checking whether a point belongs to a loaded region
* selecting map data

A valid region must have:

```text
minLatitude <= maxLatitude
minLongitude <= maxLongitude
```

Coordinates must also be within legal geographic ranges.

---

# 9. model/HazardState.java

## Purpose

Represents the internal routing form of a hazard.

The application has the canonical `HazardDto`.

GEO converts the information it needs into an internal representation suitable for routing.

Important properties include:

```text
hazard ID
location/geometry
severity
radius or affected area
blocking state
status
expiry
```

Only hazards that are currently active should influence routing.

Resolved and expired hazards must not remain active.

---

# 10. model/RouteComputation.java

## Purpose

Represents internal information produced while calculating a route.

It keeps routing information separate from the canonical application-facing `RouteDto`.

The internal representation may contain graph-specific information that should not leak into the React Native layer.

---

# 11. GraphNode.java

## Purpose

Represents a node in the offline road graph.

A node normally represents:

* an intersection
* a road junction
* another relevant routing point

Typical information:

```text
nodeId
GeoPoint
outgoingEdges
```

Example:

```text
A ---- B ---- C
       |
       D
```

`A`, `B`, `C`, and `D` are graph nodes.

---

# 12. GraphEdge.java

## Purpose

Represents a directed road segment between two graph nodes.

Typical information:

```text
edgeId
fromNodeId
toNodeId
distanceM
baseCost
blocked
hazardPenalty
roadType
```

## Directed graph

A road graph is directed.

For a two-way road:

```text
A ---> B
A <--- B
```

there should be two directed edges.

For a one-way road:

```text
A ---> B
```

only the permitted direction exists.

This is important because routing must respect real road direction.

---

# 13. RoadGraph.java

## Purpose

`RoadGraph` is the main in-memory representation of the active road network.

It manages:

* nodes
* directed edges
* adjacency
* node lookup
* edge lookup
* nearest-node selection

A graph can be represented as:

```text
        B
       / \
      /   \
     A     C
      \
       D
```

Internally, each node stores or references its outgoing edges.

This makes route expansion efficient because A* can directly retrieve neighboring nodes.

---

# 14. AStarRouter.java

## Purpose

Calculates routes through the road graph using the A* algorithm.

The fundamental equation is:

```text
f(n) = g(n) + h(n)
```

where:

* `g(n)` = known cost from the start to node `n`
* `h(n)` = estimated remaining cost to the destination
* `f(n)` = estimated total cost

## Main data structures

A* uses:

```text
OpenSet
Closed/visited set
gScore
fScore
cameFrom
```

## Process

```text
Start
  |
  v
OpenSet
  |
  v
Select node with lowest fScore
  |
  +---- destination? ---- yes ---> reconstruct route
  |
  no
  |
  v
Expand outgoing edges
  |
  v
Skip blocked edges
  |
  v
Calculate tentative cost
  |
  v
Update gScore/fScore/cameFrom
  |
  v
Repeat
```

## Important rule

The heuristic and edge cost must use compatible units.

For example:

```text
distance cost -> distance heuristic
```

or:

```text
time cost -> time heuristic
```

Do not add metres and seconds together.

---

# 15. HazardProjector.java

## Purpose

Converts active geographic hazards into routing effects.

A hazard normally does not correspond exactly to a graph node.

For example:

```text
B -------------------------- C
             X
           hazard
```

The hazard may lie somewhere in the middle of edge `BC`.

The projector determines which graph edges are affected.

## Routing model

An edge keeps its original cost:

```text
baseCost = 10
```

The hazard adds dynamic cost:

```text
hazardPenalty = 50
```

Therefore:

```text
effectiveCost = baseCost + hazardPenalty
```

A severe enough hazard may instead block the edge completely.

## Important rule

Hazards must not permanently destroy the original road cost.

The base map is static.

Hazard effects are dynamic.

---

# 16. RouteResult.java

## Purpose

Stores the result of A* before converting it into the canonical `RouteDto`.

It can contain:

* selected graph edges
* route distance
* avoided hazard IDs
* route information needed by `OfflineGeoEngine`

This keeps graph-specific routing data separate from the TypeScript contract.

---

# 17. NearbySearch.java

## Purpose

Finds nearby locally known objects without contacting an online Places API.

Flow:

```text
center
  |
  v
candidate objects
  |
  v
DistanceCalculator
  |
  v
filter by radius
  |
  v
sort by distance
  |
  v
NearbyItem results
```

Examples include:

* hospitals
* shelters
* resources
* hazards
* incidents

Only locally available information should be used.

---

# 18. OfflineMapManager.java

## Purpose

Manages the availability and loading of offline map data.

Runtime sources are:

```text
BUNDLED
LOCAL_CACHE
```

The runtime should not download map data.

The intended pipeline is:

```text
OSM / local map source
        |
        v
Preprocessing
        |
        v
BLACKOUT local graph format
        |
        v
OfflineMapManager
        |
        v
RoadGraph
```

The entire raw OSM dataset should not be loaded into memory unnecessarily.

Only the requested map region should be loaded.

---

# 19. source/OfflineMapSource.java

## Purpose

Defines the abstraction for an offline map source.

It allows GEO to obtain map data without coupling the engine to one storage mechanism.

Possible implementations include:

```text
BundledMapSource
LocalMapCache
```

This follows a source abstraction so that the routing engine does not need to know where map data came from.

---

# 20. source/BundledMapSource.java

## Purpose

Loads map data packaged with the application.

This is useful when the application must work completely offline from first launch.

Conceptually:

```text
Application APK
     |
     v
Bundled map data
     |
     v
BundledMapSource
     |
     v
RoadGraph
```

No network access is required.

---

# 21. source/LocalMapCache.java

## Purpose

Provides locally stored map data.

It can be used when map data has already been stored on the device.

It must remain an offline/local source.

It should not introduce an internet dependency into GEO.

---

# 22. Relationship with TypeScript Contracts

The TypeScript contracts are the application-level source of truth.

Important contracts include:

```text
src/contracts/geo/
├── GeoEngine.ts
├── LocationDto.ts
├── HazardDto.ts
└── RouteDto.ts
```

GEO must respect these definitions.

For example:

```text
LocationDto
├── latitude
├── longitude
├── accuracy_m
└── captured_at
```

and:

```text
RouteDto
├── route_id
├── origin
├── destination
├── distance_m
├── duration_s
├── geometry
├── avoided_hazard_ids
└── calculated_at
```

Do not create competing TypeScript contracts.

---

# 23. Native Bridge Boundary

The intended architecture is:

```text
React Native
      |
      v
GeoEngineAdapter.ts
      |
      v
BlackoutNativeBridge
      |
      v
BlackoutNativeModule.java
      |
      v
OfflineGeoEngine
```

The native bridge is only an integration boundary.

It should:

* receive arguments
* convert bridge values
* call `OfflineGeoEngine`
* convert results
* resolve/reject promises
* emit required location events

It should NOT contain:

* A*
* graph construction
* OSM parsing
* hazard mathematics
* GPS state machines
* Room/database logic

The shared bridge is integration-owned by the relevant team member. GEO should request bridge changes rather than creating a competing native module.

---

# 24. DATA Integration

DATA owns incident/report persistence and confidence logic.

GEO consumes the resulting hazard information.

Conceptually:

```text
NET
 |
 v
MessageDto
 |
 v
DATA
 |
 v
Hazard information
 |
 v
GEO
 |
 v
HazardProjector
 |
 v
A*
 |
 v
RouteDto
```

GEO must not import Room entities or reproduce DATA's incident aggregation/confidence logic.

---

# 25. NET Integration

NET is responsible for communication.

GEO does not care whether information arrives through:

* Bluetooth Low Energy
* Wi-Fi Direct
* TCP
* store-and-forward
* another transport

GEO should consume canonical data rather than importing network transport classes.

---

# 26. UI Integration

The UI should not know about:

* graph nodes
* graph edges
* A*
* OSM parsing
* GPS listener implementation
* hazard projection mathematics

The UI receives canonical data such as:

```text
LocationDto
HazardDto
RouteDto
NearbyItemDto
```

The map UI is responsible for rendering.

GEO is responsible for calculating and supplying the data.

---

# 27. Error Handling

GEO should use the shared `Result<T>` and `BlackoutError` contracts at the application boundary.

Possible GEO errors include:

```text
VALIDATION
NOT_FOUND
UNAVAILABLE
TIMEOUT
STORAGE
PERMISSION
UNSUPPORTED
NOT_IMPLEMENTED
```

Examples:

### Invalid location

```text
VALIDATION
```

### GPS permission missing

```text
PERMISSION
```

### Offline map unavailable

```text
UNAVAILABLE
```

### Local map storage failure

```text
STORAGE
```

### Unsupported geometry

```text
UNSUPPORTED
```

Expected application conditions should become stable error results rather than raw implementation exceptions crossing the native bridge.

---

# 28. No-Route Behavior

GEO must explicitly handle:

* map unavailable
* origin outside loaded region
* destination outside loaded region
* no suitable graph node
* disconnected graph
* all paths blocked
* invalid input
* unsupported geometry
* local map/storage failure

A successful route must never be represented by an empty geometry.

If no safe route exists, GEO must return an explicit failure.

---

# 29. Testing Strategy

The pure Java GEO engine should be tested independently of Android.

The test source is:

```text
geo-test/
└── GeoCoreTest.java
```

This allows core GEO behavior to be tested with the normal Java compiler.

The test suite covers:

* Haversine distance
* same-point distance
* location validation
* stale location rejection
* poor accuracy rejection
* A* shortest path
* directed graph behavior
* blocked-road rerouting
* hazard rerouting
* expired hazard handling
* hazard blocking
* map-region validation
* nearby-radius filtering
* no-route behavior

Example synthetic graph:

```text
A ---- B ---- C
       |
       D
       |
       C
```

This allows routing behavior to be tested without real OSM data.

---

# 30. Running GEO Core Tests Without Android Studio

The pure GEO classes can be compiled directly using `javac`.

From the repository root:

```powershell
Remove-Item -Recurse -Force .\geo-test-out -ErrorAction SilentlyContinue
New-Item -ItemType Directory .\geo-test-out
```

Then compile the GEO classes and test:

```powershell
javac -d geo-test-out `
android/app/src/main/java/com/blackout/geolocation/model/GeoPoint.java `
android/app/src/main/java/com/blackout/geolocation/model/HazardState.java `
android/app/src/main/java/com/blackout/geolocation/model/MapRegionInternal.java `
android/app/src/main/java/com/blackout/geolocation/model/RouteComputation.java `
android/app/src/main/java/com/blackout/geolocation/DistanceCalculator.java `
android/app/src/main/java/com/blackout/geolocation/LocationValidator.java `
android/app/src/main/java/com/blackout/geolocation/GraphNode.java `
android/app/src/main/java/com/blackout/geolocation/GraphEdge.java `
android/app/src/main/java/com/blackout/geolocation/RoadGraph.java `
android/app/src/main/java/com/blackout/geolocation/HazardProjector.java `
android/app/src/main/java/com/blackout/geolocation/AStarRouter.java `
android/app/src/main/java/com/blackout/geolocation/RouteResult.java `
android/app/src/main/java/com/blackout/geolocation/NearbySearch.java `
android/app/src/main/java/com/blackout/geolocation/OfflineMapManager.java `
android/app/src/main/java/com/blackout/geolocation/source/OfflineMapSource.java `
android/app/src/main/java/com/blackout/geolocation/source/BundledMapSource.java `
android/app/src/main/java/com/blackout/geolocation/source/LocalMapCache.java `
android/app/src/main/java/com/blackout/geolocation/OfflineGeoEngine.java `
geo-test/GeoCoreTest.java
```

Run:

```powershell
java -cp geo-test-out com.blackout.geolocation.GeoCoreTest
```

The expected final result is:

```text
PASSED: <number>
FAILED: 0
ALL GEO CORE TESTS PASSED
```

The `geo-test-out` directory contains generated `.class` files and should not be committed.

---

# 31. Test Philosophy

The tests are intentionally separated from Android.

This allows the following distinction:

```text
Pure Java logic
     |
     v
javac + GeoCoreTest
```

versus:

```text
Android-specific integration
     |
     v
Android/React Native integration testing
```

This is useful because graph and routing bugs can be found without needing Android Studio or a physical device.

---

# 32. Implementation Order

GEO should be implemented in this order:

```text
1. Verify TypeScript contracts
2. GeoPoint and internal models
3. DistanceCalculator
4. LocationValidator
5. RoadGraph
6. AStarRouter
7. RouteResult
8. HazardProjector
9. OfflineMapManager
10. Offline map sources
11. AndroidLocationProvider
12. OfflineGeoEngine
13. Pure Java tests
14. Native bridge integration
15. GeoEngineAdapter integration
16. Physical-device offline validation
```

The routing core should work before bridge integration.

---

# 33. Offline Definition of Done

GEO is complete only when:

* GPS location can be obtained without internet
* invalid/stale GPS fixes are rejected
* an offline map region can be loaded
* a road graph can be queried
* A* can calculate a route
* blocked roads are avoided
* active hazards affect routing
* expired/resolved hazards do not affect routing
* no-route situations are explicit
* nearby search works from local data
* canonical DTOs are respected
* native bridge integration works
* the application works with internet disabled

A map appearing on screen is not sufficient to consider GEO complete.

---

# 34. Current Ownership Boundary

Member 3 / GEO owns:

```text
GNSS location
Location validation
Distance calculation
Road graph
A*
Hazard projection
Offline map management
Nearby search
Route construction
OfflineGeoEngine
GEO tests
```

GEO does not own:

```text
React Native UI
Map rendering
BLE
Wi-Fi Direct
TCP
Peer discovery
Room persistence
Incident confidence
Emergency-report business logic
Cloud routing
Google Maps
```

---

# 35. Git Workflow

Work should remain on the dedicated branch:

```text
feature/geo
```

Recommended focused commits include:

```text
feat(geo): add location validation
feat(geo): add road graph
feat(geo): implement A* routing
feat(geo): add hazard projection
feat(geo): add offline map manager
feat(geo): add geo core tests
```

The final GEO handoff should contain:

* implementation
* tests
* README
* no generated build output
* no unrelated dependency changes
* no accidental IDE configuration
* documented bridge requirements
* documented known limitations
