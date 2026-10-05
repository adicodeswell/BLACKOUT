# BLACKOUT \| DATA Milestones
## Purpose
This is the chronological implementation plan for Member 2 — DATA. The original detailed tasks are grouped into **20 directly related milestones** so each milestone represents one coherent implementation unit with clear dependencies and acceptance criteria.
### Core dependency order
**Contracts → Database → Entities → DAOs → Repositories → Engine → Messages/DMs → Reports → Incidents → Confidence/Intelligence → Resources/Hazards → Events → Bridge → Integration → Security → Testing → Hardening → Acceptance**
---
## Milestone 1 — Repository Audit & Contract Freeze
**Combine:** original Milestones 0–1
### Implement
- Inspect `contracts/data`, `contracts/network`, `contracts/security`.
- Locate all canonical DTOs, requests, filters, events, Result/error types, adapters, bridge code, Room code, and security abstractions.
- Verify `DataEngine`, `MessageDto`, `EmergencyReportDto`, `IncidentDto`, `EvidenceDto`, `ResourceDto`, and delivery contracts.
- Confirm `DIRECT` vs `REPORT` semantics.
- Check whether DIRECT encryption metadata already exists.
- If a contract change is genuinely required, make the smallest compatible change and update all consumers, fakes, adapters, and tests.
### Rules
- No duplicate/private DTOs.
- No `sendDM()` in DATA.
- No `DmEngine`.
- `saveMessage()` must not call `createReport()`.
### Exit criteria
- Canonical DATA contract is understood and frozen.
- TypeScript contracts compile.
- DATA dependency map is documented.
---
## Milestone 2 — Room Database Foundation
**Combine:** original Milestones 2 + 6
### Implement
- Room database class.
- Database versioning.
- Type converters.
- ID/timestamp handling.
- Database singleton/dependency injection.
- Foreign-key strategy.
- Transaction configuration.
- Initial migration architecture.
- Explicit migrations from existing versions.
- Migration tests.
- Restart/reopen persistence tests.
### Exit criteria
- Database opens successfully.
- Schema versioning is explicit.
- Supported migrations pass.
- Data survives database reopen/restart.
---
## Milestone 3 — Complete Room Entity Model
**Combine:** original Milestone 3
### Implement
- `DeviceProfileEntity`
- `PeerEntity`
- `NetworkMessageEntity`
- `EmergencyReportEntity`
- `IncidentEntity`
- `EvidenceEntity`
- `ResourceEntity`
- `HazardEntity`
- `ConfidenceStateEntity`
- `DeliveryEntity`
- `SeenMessageEntity`
For each entity define:
- Primary keys.
- Required/optional fields.
- Foreign keys.
- Indexes.
- Uniqueness constraints.
- Timestamps.
- Relationships.
### DIRECT rule
`NetworkMessageEntity` must support encrypted DIRECT messages. Do not create a separate `DmEntity` unless the canonical data model explicitly requires one.
### Exit criteria
- All entities compile.
- Room schema matches the canonical data model.
- Entity tests pass.
---
## Milestone 4 — DAO Layer
**Combine:** original Milestone 4
### Implement DAOs for
- Messages.
- Reports.
- Incidents.
- Evidence.
- Resources.
- Hazards.
- Confidence.
- Delivery.
- Seen messages.
- Peers/device profile where required.
### Queries
- Insert/upsert.
- ID lookup.
- Pending outbound.
- Delivery state changes.
- Reports by incident.
- Incident filtering.
- Evidence lookup.
- Resource filtering.
- Confidence retrieval.
- Seen-message checks.
- Fresh/stale data queries where required.
### Rules
DAOs contain persistence/query logic only.
No:
- incident similarity
- confidence formulas
- crypto
- network logic
- UI logic
### Exit criteria
- DAO tests pass.
- Frequent queries have correct indexes.
---
## Milestone 5 — Repository Layer & Transactions
**Combine:** original Milestone 5
### Implement
Repositories for:
- Message
- Report
- Incident
- Evidence
- Resource
- Hazard
- Confidence
- Delivery
- SeenMessage
- Peer/DeviceProfile where required
### Responsibilities
- Room entity ↔ DTO conversion.
- Multi-DAO transactions.
- Persistence rules.
- Error mapping.
- Keep Room/Android classes out of public contracts.
### Exit criteria
- Repository tests pass.
- Transaction boundaries are correct.
- No Room entities leak outside DATA.
---
## Milestone 6 — RoomDataEngine Foundation
**Combine:** original Milestone 7 + part of 19
### Implement
- `RoomDataEngine`.
- Repository dependency injection.
- Lifecycle/start/stop if required.
- Result/error conversion.
- Contract delegation.
First expose:
- `saveMessage()`
- `getMessage()`
- `getPendingOutbound()`
- `markDelivered()`
- `getIncident()`
- `listIncidents()`
- `updateIncident()`
- `addEvidence()`
- Resource methods.
### Exit criteria
- Real Room CRUD works through `RoomDataEngine`.
- No placeholder production methods remain for implemented functionality.
---
## Milestone 7 — Message Persistence, Deduplication & Delivery
**Combine:** original Milestone 8
### Implement
- Incoming/outgoing message persistence.
- Exact `message_id` duplicate detection.
- Seen-message persistence.
- Outbound queue persistence.
- Delivery state:
	`CREATED → QUEUED → SENT → RECEIVED → DELIVERED`
- Retry/failure/expiry:
	`RETRYING`, `FAILED`, `EXPIRED`
- Original `message_id` preservation during forwarding.
### Exit criteria
- Messages survive restart.
- Duplicate logical messages are prevented.
- Delivery state is persistent and recoverable.
---
## Milestone 8 — DIRECT DM Security & Storage Semantics
**Combine:** original Milestones 8 + 23
### Implement/verify
- DIRECT is treated as a private DM, not an emergency report.
- DIRECT requires a destination.
- DIRECT application payload is encrypted according to the canonical security design.
- Encrypted content/security metadata is persisted.
- Relay devices can forward without plaintext access.
- Tampered ciphertext/authentication data is rejected.
- Security keys remain in the security/crypto layer.
- DATA does not inspect DIRECT plaintext.
- DIRECT never creates an EmergencyReport, Incident, confidence update, or independent report source.
### Architecture rule
Do not put crypto inside:
- RoomDataEngine
- DAOs
- repositories
- TypeScript adapters
- React Native bridge
### Exit criteria
- DM security tests pass.
- Encrypted messages survive restart.
- Relay/storage cannot access plaintext.
---
## Milestone 9 — Emergency Report Persistence
**Combine:** original Milestone 9
### Implement
- `createReport()`.
- Report validation.
- Report ID.
- Reporter device ID.
- Category.
- Description.
- Location.
- Observed/created timestamps.
- Severity.
- Verification state.
- Evidence references.
- Source type.
### Important separation
`REPORT` → EmergencyReport processing.
`DIRECT` → private message processing.
They must never share aggregation logic.
### Exit criteria
- Valid reports persist/retrieve correctly.
- Invalid reports return canonical errors.
- Reports survive restart.
---
## Milestone 10 — Incident Creation & Aggregation
**Combine:** original Milestone 10
### Implement
`S = 0.35*S_geo + 0.20*S_time + 0.20*S_category + 0.15*S_text + 0.10*S_evidence`
Merge only when:
- `S >= 0.70`
- Categories are compatible.
Initial radius:
- `500m`
Implement:
- Geographic similarity.
- Temporal similarity.
- Category compatibility.
- Normalized-token Jaccard similarity.
- Shared evidence similarity.
- Incident creation.
- Conservative matching.
Text normalization:
- lowercase
- Unicode normalization
- punctuation removal
- token splitting
- fixed documented stop-word list
### Exit criteria
- Same-event reports aggregate.
- Unrelated reports remain separate.
- Threshold boundary tests pass.
---
## Milestone 11 — Independent Sources & Evidence Correlation
**Combine:** original Milestones 11 + 14
### Implement
- Independent source counting from original `reporter_device_id`.
- Forwarded copies do not increase source count.
- Evidence persistence.
- Content hashes.
- Evidence-report relationships.
- Evidence-incident relationships where required.
- Shared-content detection.
- Duplicate evidence handling.
- Supporting evidence counts.
### Core rule
Three forwarded copies from one reporter = **one independent source**.
### Exit criteria
- Source counting is correct.
- Duplicate evidence does not artificially increase confidence.
- Evidence survives restart.
---
## Milestone 12 — Confidence Engine
**Combine:** original Milestone 12
### Implement
```plain text
independence = min(independent_source_count / SOURCE_TARGET, 1)
corroboration = min(max(independent_source_count - 1, 0) / max(SOURCE_TARGET - 1, 1), 1)
evidence = min(supporting_evidence / 2, 1)
freshness = max(0, 1 - age_ms / freshness_window_ms)
trusted_confirmation = 1 if trusted confirmation exists else 0
contradiction = min(contradiction_count / 2, 1)

raw =
    0.35 * independence
  + 0.25 * evidence
  + 0.20 * corroboration
  + 0.10 * freshness
  + 0.10 * trusted_confirmation

final = clamp(0, 1, raw - 0.20 * contradiction)
```
Configuration:
- `SOURCE_TARGET = 3`
- high-confidence threshold = `0.50`
- confirmation threshold = `0.80`
- contradiction penalty = `0.20`
Levels:
- `0.00–0.24` → UNVERIFIED
- `0.25–0.49` → LIKELY
- `0.50–0.79` → HIGH_CONFIDENCE
- `0.80–1.00` → CONFIRMED only with trusted confirmation
Without trusted confirmation, cap at HIGH_CONFIDENCE.
Persist the component values/rationale.
### Exit criteria
- Calculation is deterministic.
- Same inputs produce same result.
- Confidence tests pass.
---
## Milestone 13 — Contradictions, Freshness & Incident Lifecycle
**Combine:** original Milestones 13 + 15 + 17
### Contradictions
- Supporting/contradicting report relationships.
- Contradiction count.
- Confidence penalty.
- Contradiction persistence.
- Visibility of conflicting observations.
- Never silently delete/overwrite contradictory reports.
### Freshness
`freshness = max(0, 1 - age / freshness_window)`
Use domain-specific windows for:
- incidents
- reports
- resources
- hazards
- confidence
Historical data remains available but stale information is distinguishable.
### Lifecycle
`NEW → OPEN → MONITORING → RESOLVED`
or:
`OPEN → MONITORING → EXPIRED`
Resolution/expiry never erases historical reports/evidence.
### Exit criteria
- Contradictions persist.
- Freshness is deterministic and clamped to `[0,1]`.
- Lifecycle and freshness survive restart.
---
## Milestone 14 — Severity, Resources & Hazards
**Combine:** original Milestones 15 + 16
### Severity baseline
- TRAPPED_PERSON → HIGH
- BUILDING_COLLAPSE → HIGH
- FIRE → HIGH
- FLOOD → HIGH
- MEDICAL → HIGH
- BLOCKED_ROAD → MEDIUM
- FOOD/WATER/SHELTER → LOW
- OTHER → user-selected severity within allowed range
Explicitly higher user severity must not be silently lowered.
### Resources
- Create/list/update.
- Filters.
- Availability/status.
- Location/freshness.
### Hazards
- Persistence.
- Updates.
- Location/freshness.
- Canonical relationships.
### Rule
Routing algorithms do not belong in DATA.
### Exit criteria
- Resources/hazards persist.
- Filters work.
- Severity rules are tested.
---
## Milestone 15 — DATA Events & Contract Completion
**Combine:** original Milestones 18 + 19
### Implement events
- `REPORT_CREATED`
- `INCIDENT_UPDATED`
- `CONFIDENCE_UPDATED`
- message/delivery events
- resource/hazard events defined by the contract
### Rules
- Events describe completed state changes.
- Never expose Room entities.
- Use canonical DTOs/IDs.
- Listener lifecycle must avoid leaks and duplicate registration.
- Room remains the authoritative state.
### Contract completion
Verify every canonical DATA method has a real implementation, including:
- `createReport`
- `saveMessage`
- `getMessage`
- `getPendingOutbound`
- `markDelivered`
- `getIncident`
- `listIncidents`
- `updateIncident`
- `addEvidence`
- `createResource`
- `listResources`
- `updateResource`
- `calculateConfidence`
- `subscribe`
### Exit criteria
- No production placeholders.
- Events work.
- Error behavior matches canonical Result/error model.
---
## Milestone 16 — TypeScript Adapter & Native Bridge
**Combine:** original Milestones 20 + 21
### Flow
`DataEngineAdapter.ts → BlackoutNativeModule.java → RoomDataEngine.java`
### Adapter
Only:
- argument conversion
- result conversion
- error conversion
No:
- SQL
- incident matching
- confidence formulas
- crypto
### Bridge
For every method:
1. Receive RN arguments.
2. Validate/convert.
3. Call `RoomDataEngine`.
4. Convert result.
5. Resolve/reject.
Bridge must not contain:
- Room queries.
- Aggregation.
- Confidence.
- Evidence matching.
- Network logic.
- TTL/forwarding.
- Crypto.
### Exit criteria
- TypeScript can invoke real DATA operations.
- Bridge integration tests pass.
---
## Milestone 17 — NET ↔ DATA Integration
**Combine:** original Milestone 22
### Implement/verify
- NET receives messages.
- NET validates protocol/routing.
- DATA persists messages.
- REPORT messages enter report processing.
- DIRECT messages remain encrypted/private.
- ACK/delivery state persists.
- Forwarding preserves original `message_id`.
- Forwarded report copies do not increase independent source count.
### Exit criteria
- DIRECT and REPORT end-to-end flows pass independently.
---
## Milestone 18 — Complete DATA Test Suite
**Combine:** original Milestone 24 + relevant validation from earlier milestones
### Unit tests
- Report validation.
- Incident similarity.
- Text normalization.
- Source counting.
- Confidence formula.
- Contradiction penalty.
- Freshness.
- Severity.
- Lifecycle.
- Duplicate detection.
### Room/instrumentation tests
- Entity persistence.
- DAO queries.
- Repository behavior.
- Transactions.
- Migrations.
- Restart persistence.
### Integration tests
- `createReport → incident → confidence`
- report + contradiction → confidence change
- evidence → confidence change
- message → delivery state
- DIRECT → encrypted persistence, no incident creation
- REPORT → report/incident processing
- NET → DATA → bridge
### Exit criteria
- All DATA tests pass.
- Tests do not depend on internet availability.
---
## Milestone 19 — Physical Validation, Recovery & Performance
**Combine:** original Milestones 25 + 26
### Physical Android validation
Test:
- app restart
- process death/relaunch
- database reopen
- interrupted writes
- duplicate messages
- repeated reports
- offline operation
- expected prototype-scale local data
- network unavailable
- connectivity returning after offline operation
Verify:
- no supported-condition data loss
- no duplicate logical incidents
- delivery state remains consistent
- historical data remains available
### Performance/hardening
Review:
- Room indexes.
- Query plans.
- Transaction boundaries.
- Large incident/report lists.
- Evidence/content-hash lookups.
- Seen-message deduplication.
- Outbound queue queries.
- Event listener lifecycle.
- N+1 query risks.
- Unbounded memory accumulation.
- Repeated confidence calculations.
### Exit criteria
- Physical-device scenarios pass.
- No obvious persistence/performance bottlenecks.
---
## Milestone 20 — Final DATA Acceptance Gate
**Combine:** original Milestone 27
DATA is complete only when:
- [ ] Canonical contracts are implemented.
- [ ] Room database is persistent.
- [ ] Entities and indexes are implemented.
- [ ] DAOs are tested.
- [ ] Repositories are tested.
- [ ] Migrations are tested.
- [ ] `RoomDataEngine` is fully implemented.
- [ ] Messages persist correctly.
- [ ] DIRECT messages remain encrypted/private and are never aggregated as reports.
- [ ] Reports persist correctly.
- [ ] Reports aggregate into incidents using the documented deterministic model.
- [ ] Independent source counting is correct.
- [ ] Confidence recalculates deterministically and stores rationale.
- [ ] Contradictions remain stored and visible.
- [ ] Evidence persists and correlates correctly.
- [ ] Resources and hazards persist correctly.
- [ ] Severity/lifecycle/freshness work correctly.
- [ ] Delivery state persists.
- [ ] DATA events are emitted correctly.
- [ ] TypeScript adapter works.
- [ ] Native bridge works.
- [ ] NET ↔ DATA integration works.
- [ ] Restart/process-death persistence works.
- [ ] DM security tests pass.
- [ ] Unit, integration, migration, and physical-device tests pass.
- [ ] No network/UI/routing/crypto business logic has leaked into DATA.
---
## Recommended implementation loop
For every milestone:
**Read contract → inspect existing code → implement smallest slice → write tests → run tests → integrate → test on device where relevant → document non-obvious behavior → commit.**
Do not start the next milestone until the current milestone's exit criteria are satisfied.
