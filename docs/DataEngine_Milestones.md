# Member 4: Data Engine Playbook (Member 2 in Docs)

The Data Engine is responsible for the permanent, offline storage of all mesh network data, the intelligent aggregation of overlapping emergency reports, and deterministic confidence scoring. When the app closes, the Network Engine's temporary in-memory queues are wiped—it is up to the Data Engine to ensure no life-saving information is lost.

Here is the structured 5-Phase implementation strategy to build the fully offline Data Engine using Android Room (SQLite).

---

## Phase 1: Foundation (Room Database & Entities)
**The Problem:** The application needs a robust relational database to store chats, emergency reports, hazards, and mesh routing states (like seen messages). 
**The Solution:** Build the core Android Room Database. Define the strict table schemas (`Entities`) and create Type Converters for complex objects (like converting GPS coordinates or Enums into SQLite-compatible primitives).

**Files to Create (`android/app/src/main/java/com/blackout/data/`):**
*   `BlackoutDatabase.java`: The core RoomDatabase instance.
*   `entity/*Entity.java`: Define exactly `DeviceProfileEntity`, `PeerEntity`, `NetworkMessageEntity`, `EmergencyReportEntity`, `IncidentEntity`, `HazardEntity`, and `SeenMessageEntity`.
*   `converters/RoomConverters.java`: Logic to serialize/deserialize Enums, Lists, and `GeoPoint` objects for SQLite storage.

---

## Phase 2: Data Access & Repositories
**The Problem:** The UI and Network Engine expect clean TypeScript contracts (`EmergencyReportDto`), but the database only understands raw SQL and Room Entities.
**The Solution:** Build DAOs (Data Access Objects) to handle the raw SQL queries, and wrap them in Repositories that handle the DTO ↔ Entity conversion.

**Files to Create:**
*   `dao/*Dao.java`: Interfaces containing exact SQL queries (e.g., `@Query("SELECT * FROM emergency_reports ORDER BY timestamp DESC")`).
*   `repository/*Repository.java`: Classes that coordinate DAOs, manage SQL transactions, and convert `EmergencyReportEntity` back into `EmergencyReportDto`.
*   `RoomDataEngine.java`: The central facade (similar to `AndroidNetworkEngine` and `OfflineGeoEngine`) that orchestrates all repositories.

---

## Phase 3: The Intelligence Engine (Aggregation & Confidence)
**The Problem:** If 50 people on the mesh network all report the same bridge collapse, we cannot show 50 separate icons on the map. We also need to know if a report is reliable (e.g., 5 independent sources vs. 1 isolated rumor), and what to do if someone submits a contradictory report (e.g., "The bridge is fine").
**The Solution:** Build a deterministic Intelligence layer. It must use spatial (GPS distance) and temporal (time) tolerances to merge overlapping `Reports` into a single `Incident`. It must calculate a strict `Confidence Score` based on evidence freshness and source independence. **Crucially: Never silently overwrite contradictory evidence.**

**Files to Create:**
*   `aggregation/IncidentAggregator.java`: Matches incoming reports to existing incidents using spatial/temporal tolerance math.
*   `confidence/ConfidenceCalculator.java`: A deterministic math algorithm tracking input factors, weights, and contradiction penalties.
*   `evidence/EvidenceCorrelator.java`: Links photos and text reports cleanly to parent Incidents.

---

## Phase 4: Migrations & Persistence Testing
**The Problem:** When we update the app in the future and add a new column to a table, Android Room will crash and wipe the user's data unless handled properly. 
**The Solution:** Write explicit SQLite `Migrations`. Never solve a schema change by doing a destructive fallback. Write exhaustive tests for transactions, deduplication, and aggregation logic.

**Files to Create:**
*   `migrations/DataMigrations.java`: `Migration(1, 2)` SQL scripts to safely alter tables.
*   *(Tests)* `DataCoreTest.java`: Write tests verifying insert/read cycles, relationship integrity, transaction rollbacks, and that confidence scores behave deterministically.

---

## Phase 5: UI Integration (React Native Bridge)
**The Problem:** The database exists in Java, but the React Native UI needs to query it to render the chat screens and map markers.
**The Solution:** Build the standard Blackout React Native bridge for the Data Engine.

**Files to Create:**
*   `bridge/BlackoutDataModule.java`: The `@ReactModule` exposing methods like `saveMessage()` and `getIncidents()`.
*   `src/adapters/data/DataEngineAdapter.ts`: The TypeScript wrapper that fulfills the `DataEngine` contract.

---
### The Golden Rule for the Data Engine:
> *A DTO is the application contract; a Room Entity is a persistence representation. Keep them entirely separate via Repositories. Do not put confidence algorithms inside a DAO.*
