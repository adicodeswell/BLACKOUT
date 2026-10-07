# BLACKOUT API Contracts & Module Interfaces Reference

This document is a local reference compiled directly from the authoritative Notion workspace documentation for **BLACKOUT API Contracts & Module Interfaces**.

---

## 1. Canonical Contract Rules

- **Timestamps**: All application timestamps use Unix milliseconds as `number`.
- **Identifiers**: `message_id`, `device_id`, `peer_id`, `report_id`, `incident_id`, `evidence_id`, `resource_id`, and `hazard_id` are strings.
- **Protocol Version**: `protocol_version` is a `number`.
- **Message Priority**:
  - `CRITICAL_EMERGENCY`
  - `HIGH`
  - `NORMAL`
  - `LOW`
- **Isolation**: Cross-module references use stable IDs and DTOs. TypeScript contracts do not import Android classes. React Native UI components never import `WifiP2pManager`, `BluetoothAdapter`, GNSS APIs, Room DAOs, or ONNX classes.
- **Offline First**: No contract requires an active internet connection.

---

## 2. Common & Shared Error Contracts (`src/contracts/common/` & `src/contracts/errors/`)

### Error Codes (`BlackoutErrorCode`)
```typescript
export type BlackoutErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAVAILABLE"
  | "TIMEOUT"
  | "CONFLICT"
  | "TRANSPORT"
  | "STORAGE"
  | "PERMISSION"
  | "UNSUPPORTED"
  | "SECURITY"
  | "CANCELLED"
  | "NOT_IMPLEMENTED";
```

### Blackout Error (`BlackoutError`)
```typescript
export type BlackoutModule =
  | "NETWORK"
  | "DATA"
  | "GEO"
  | "AI"
  | "APP"
  | "SYNC";

export interface BlackoutError {
  code: BlackoutErrorCode;
  message: string;
  retryable: boolean;
  module: BlackoutModule;
  details?: Record<string, unknown>;
}
```

### Result Monad (`Result<T>`)
```typescript
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: BlackoutError };
```

---

## 3. Network Engine Contracts (`src/contracts/network/`) — Member 1

### Message DTO (`MessageDto`)
```typescript
export type MessageType =
  | "HELLO"
  | "HELLO_ACK"
  | "CAPABILITIES"
  | "CAPABILITIES_ACK"
  | "QUEUE_SUMMARY"
  | "DIRECT"
  | "BROADCAST"
  | "REPORT"
  | "ACK"
  | "RESOURCE"
  | "HAZARD"
  | "SYNC";

export type MessagePriority =
  | "CRITICAL_EMERGENCY"
  | "HIGH"
  | "NORMAL"
  | "LOW";

export interface MessageEncryption {
  algorithm: "AES_GCM";
  key_id: string;
  nonce: string;
}

export interface MessageDto {
  protocol_version: number;
  message_id: string;
  origin_device_id: string;
  destination_device_id?: string;
  message_type: MessageType;
  created_at: number;
  ttl: number;
  hop_count: number;
  priority: MessagePriority;
  payload_hash: string;
  payload: unknown;
  encryption?: MessageEncryption;
  signature: string;
}

export type DeliveryState =
  | "CREATED"
  | "QUEUED"
  | "SENT"
  | "RECEIVED"
  | "DELIVERED"
  | "RETRYING"
  | "FAILED"
  | "EXPIRED";

export interface DeliveryStatus {
  message_id: string;
  state: DeliveryState;
  updated_at: number;
  attempts: number;
  last_error?: BlackoutError;
}

export interface DeliveryHandle {
  message_id: string;
  accepted_at: number;
}
```

### Peer DTO (`PeerDto`)
```typescript
export type PeerTransport = "BLE" | "WIFI_DIRECT";

export type PeerConnectionState =
  | "DISCOVERED"
  | "CONNECTING"
  | "HANDSHAKING"
  | "CONNECTED"
  | "LOST";

export interface PeerDto {
  peer_id: string;
  transport: PeerTransport;
  connection_state: PeerConnectionState;
  last_seen_at: number;
  capabilities: string[];
}
```

### Network Events (`NetworkEvents.ts`)
```typescript
export type NetworkEvent =
  | { type: "PEER_DISCOVERED"; peer: PeerDto }
  | { type: "PEER_CONNECTED"; peer: PeerDto }
  | { type: "PEER_DISCONNECTED"; peer_id: string }
  | { type: "MESSAGE_RECEIVED"; message: MessageDto }
  | { type: "MESSAGE_DELIVERY_UPDATED"; status: DeliveryStatus };
```

### Network Engine Interface (`NetworkEngine.ts`)
```typescript
export interface NetworkEngine {
  start(): Promise<Result<void>>;
  stop(): Promise<Result<void>>;

  discoverPeers(): Promise<Result<PeerDto[]>>;
  getPeers(): Promise<Result<PeerDto[]>>;

  connect(peerId: string): Promise<Result<void>>;
  disconnect(peerId: string): Promise<Result<void>>;

  send(message: MessageDto): Promise<Result<DeliveryHandle>>;
  broadcast(message: MessageDto): Promise<Result<DeliveryHandle>>;

  getDeliveryStatus(messageId: string): Promise<Result<DeliveryStatus>>;

  subscribe(listener: (event: NetworkEvent) => void): () => void;
}
```

---

## 4. Data & Intelligence Contracts (`src/contracts/data/`) — Member 2

### Emergency Report (`EmergencyReport.ts`)
```typescript
export type ReportCategory =
  | "FIRE"
  | "FLOOD"
  | "MEDICAL"
  | "BUILDING_COLLAPSE"
  | "TRAPPED_PERSON"
  | "BLOCKED_ROAD"
  | "FOOD"
  | "WATER"
  | "SHELTER"
  | "OTHER";

export type Severity =
  | "UNKNOWN"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type VerificationLevel =
  | "UNVERIFIED"
  | "LIKELY"
  | "HIGH_CONFIDENCE"
  | "CONFIRMED";

export interface EmergencyReportDto {
  report_id: string;
  incident_id?: string;
  reporter_device_id: string;
  category: ReportCategory;
  description: string;
  location?: LocationDto;
  observed_at?: number;
  created_at: number;
  severity: Severity;
  verification_state: VerificationLevel;
  evidence_ids: string[];
}

export interface CreateReportRequest {
  category: ReportCategory;
  description: string;
  location?: LocationDto;
  observed_at?: number;
  severity: Severity;
  source_type?: "USER" | "SENSOR" | "AI_ASSISTED";
  evidence_ids?: string[];
}
```

### Incident & Confidence DTOs (`IncidentDto.ts`)
```typescript
export type IncidentStatus =
  | "OPEN"
  | "MONITORING"
  | "RESOLVED"
  | "EXPIRED";

export interface IncidentDto {
  incident_id: string;
  category: string;
  title: string;
  summary: string;
  location?: LocationDto;
  first_reported_at: number;
  last_updated_at: number;
  status: IncidentStatus;
  severity: Severity;
  confidence_level: VerificationLevel;
  independent_source_count: number;
  contradiction_count: number;
  evidence_count: number;
}

export interface IncidentFilter {
  category?: string;
  status?: IncidentStatus;
  min_confidence?: VerificationLevel;
  center?: LocationDto;
  radius_m?: number;
}

export interface UpdateIncidentRequest {
  incident_id: string;
  title?: string;
  summary?: string;
  status?: IncidentStatus;
  severity?: Severity;
}

export interface ConfidenceStateDto {
  incident_id: string;
  level: VerificationLevel;
  independent_sources: number;
  supporting_evidence: number;
  contradictions: number;
  freshness_factor: number;
  rationale: string;
  calculated_at: number;
}
```

### Evidence DTOs (`EvidenceDto.ts`)
```typescript
export type EvidenceType =
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT"
  | "TEXT";

export type EvidenceAnalysisState =
  | "PENDING"
  | "COMPLETE"
  | "FAILED";

export interface EvidenceDto {
  evidence_id: string;
  incident_id: string;
  report_id?: string;
  type: EvidenceType;
  local_uri?: string;
  content_hash?: string;
  captured_at?: number;
  location?: LocationDto;
  source_device_id: string;
  analysis_state: EvidenceAnalysisState;
}

export interface AddEvidenceRequest {
  incident_id: string;
  report_id?: string;
  type: EvidenceType;
  local_uri?: string;
  content_hash?: string;
  captured_at?: number;
  location?: LocationDto;
}
```

### Resource DTOs (`ResourceDto.ts`)
```typescript
export type ResourceType =
  | "SHELTER"
  | "FOOD"
  | "WATER"
  | "MEDICINE"
  | "MEDICAL"
  | "OTHER";

export type ResourceAvailability =
  | "UNKNOWN"
  | "AVAILABLE"
  | "LIMITED"
  | "FULL"
  | "CLOSED";

export interface ResourceDto {
  resource_id: string;
  type: ResourceType;
  name: string;
  description?: string;
  location: LocationDto;
  availability: ResourceAvailability;
  capacity?: number;
  remaining_capacity?: number;
  source_device_id: string;
  created_at: number;
  updated_at: number;
  expires_at?: number;
}

export interface CreateResourceRequest {
  type: ResourceType;
  name: string;
  description?: string;
  location: LocationDto;
  availability: ResourceAvailability;
  capacity?: number;
  remaining_capacity?: number;
  expires_at?: number;
}

export interface ResourceFilter {
  type?: ResourceType;
  availability?: ResourceAvailability;
  center?: LocationDto;
  radius_m?: number;
}

export interface UpdateResourceRequest {
  resource_id: string;
  name?: string;
  description?: string;
  availability?: ResourceAvailability;
  capacity?: number;
  remaining_capacity?: number;
  expires_at?: number;
}
```

### Data Events (`DataEvents.ts`)
```typescript
export type DataEvent =
  | { type: "REPORT_CREATED"; report_id: string; incident_id?: string }
  | { type: "INCIDENT_UPDATED"; incident: IncidentDto }
  | { type: "RESOURCE_UPDATED"; resource_id: string }
  | { type: "HAZARD_UPDATED"; hazard_id: string }
  | { type: "CONFIDENCE_UPDATED"; confidence: ConfidenceStateDto };
```

### Data Engine Interface (`DataEngine.ts`)
```typescript
export interface DataEngine {
  createReport(report: CreateReportRequest): Promise<Result<EmergencyReportDto>>;

  saveMessage(message: MessageDto): Promise<Result<void>>;
  getMessage(messageId: string): Promise<Result<MessageDto>>;
  getPendingOutbound(): Promise<Result<MessageDto[]>>;
  markDelivered(messageId: string, deliveredAt: number): Promise<Result<void>>;

  getIncident(incidentId: string): Promise<Result<IncidentDto>>;
  listIncidents(filter?: IncidentFilter): Promise<Result<IncidentDto[]>>;
  updateIncident(request: UpdateIncidentRequest): Promise<Result<IncidentDto>>;

  addEvidence(evidence: AddEvidenceRequest): Promise<Result<EvidenceDto>>;

  createResource(resource: CreateResourceRequest): Promise<Result<ResourceDto>>;
  listResources(filter?: ResourceFilter): Promise<Result<ResourceDto[]>>;
  updateResource(request: UpdateResourceRequest): Promise<Result<ResourceDto>>;

  calculateConfidence(incidentId: string): Promise<Result<ConfidenceStateDto>>;

  subscribe(listener: (event: DataEvent) => void): () => void;
}
```

---

## 5. Geospatial Contracts (`src/contracts/geo/`) — Member 3

### Location DTO (`LocationDto.ts`)
```typescript
export interface LocationDto {
  latitude: number;
  longitude: number;
  accuracy_m?: number;
  altitude_m?: number;
  heading_deg?: number;
  speed_mps?: number;
  captured_at: number;
}
```

### Hazard DTOs (`HazardDto.ts`)
```typescript
export interface HazardDto {
  hazard_id: string;
  type: string;
  geometry: unknown;
  severity: Severity;
  source_incident_id?: string;
  status: "ACTIVE" | "RESOLVED" | "EXPIRED";
  created_at: number;
  updated_at: number;
  expires_at?: number;
}

export interface AddHazardRequest {
  type: string;
  geometry: unknown;
  severity: Severity;
  source_incident_id?: string;
  expires_at?: number;
}
```

### Route & Region DTOs (`RouteDto.ts`)
```typescript
export interface RouteOptions {
  avoid_hazards: boolean;
  avoid_blocked_roads: boolean;
  max_hazard_severity?: number;
}

export interface RouteDto {
  route_id: string;
  origin: LocationDto;
  destination: LocationDto;
  distance_m: number;
  duration_s: number;
  geometry: Array<{ latitude: number; longitude: number }>;
  avoided_hazard_ids: string[];
  calculated_at: number;
}

export interface MapRegion {
  min_latitude: number;
  min_longitude: number;
  max_latitude: number;
  max_longitude: number;
}

export interface MapLoadResult {
  region: MapRegion;
  available: boolean;
  source: "BUNDLED" | "LOCAL_CACHE";
}

export interface NearbyItemDto {
  id: string;
  type: string;
  location: LocationDto;
  distance_m: number;
  title?: string;
}
```

### Geo Engine Interface (`GeoEngine.ts`)
```typescript
export type LocationEvent = {
  type: "LOCATION_UPDATED";
  location: LocationDto;
};

export interface GeoEngine {
  getCurrentLocation(): Promise<Result<LocationDto>>;

  observeLocation(listener: (event: LocationEvent) => void): () => void;

  loadOfflineMap(region: MapRegion): Promise<Result<MapLoadResult>>;

  getHazards(region: MapRegion): Promise<Result<HazardDto[]>>;

  addHazard(hazard: AddHazardRequest): Promise<Result<HazardDto>>;

  calculateRoute(
    start: LocationDto,
    destination: LocationDto,
    options: RouteOptions
  ): Promise<Result<RouteDto>>;

  calculateDistance(a: LocationDto, b: LocationDto): Promise<Result<number>>;

  findNearby(
    type: "INCIDENT" | "RESOURCE" | "HAZARD" | "SHELTER" | "HOSPITAL",
    location: LocationDto,
    radiusM: number
  ): Promise<Result<NearbyItemDto[]>>;
}
```

---

## 6. AI Engine Contracts (`src/contracts/ai/`) — Member 4 / Member 2

### AI Contracts (`AIContracts.ts`)
```typescript
export interface ClassifyReportRequest {
  report_id: string;
  text: string;
}

export interface ReportClassification {
  category: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  model_version: string;
}

export interface SimilarityRequest {
  source_report_id: string;
  candidate_report_ids: string[];
}

export interface SimilarityResult {
  matches: Array<{
    report_id: string;
    similarity: number;
  }>;
  model_version: string;
}

export interface EvidenceAnalysisRequest {
  evidence_id: string;
  local_uri: string;
}

export interface EvidenceAnalysis {
  labels: string[];
  severity_hint?: string;
  confidence: number;
  model_version: string;
}
```

### AI Engine Interface (`AIEngine.ts`)
```typescript
export interface AIEngine {
  classifyReport(request: ClassifyReportRequest): Promise<Result<ReportClassification>>;

  detectSimilarity(request: SimilarityRequest): Promise<Result<SimilarityResult>>;

  analyzeEvidence(request: EvidenceAnalysisRequest): Promise<Result<EvidenceAnalysis>>;
}
```

---

## 7. Native Bridge Contracts (`src/contracts/events/` & `src/adapters/native/`)

### Native Events (`NativeEvents.ts`)
```typescript
export interface PermissionState {
  bluetooth: "GRANTED" | "DENIED" | "UNAVAILABLE";
  nearby_wifi: "GRANTED" | "DENIED" | "UNAVAILABLE";
  location: "GRANTED" | "DENIED" | "UNAVAILABLE";
  camera: "GRANTED" | "DENIED" | "UNAVAILABLE";
  microphone: "GRANTED" | "DENIED" | "UNAVAILABLE";
}

export type NativeBridgeEvent =
  | { type: "NETWORK"; event: NetworkEvent }
  | { type: "LOCATION"; location: LocationDto }
  | { type: "PERMISSION_CHANGED"; state: PermissionState };
```

### Blackout Native Bridge Interface (`BlackoutNativeBridge.ts`)
```typescript
export interface BlackoutNativeBridge {
  pingNative(): Promise<Result<{ status: string; native: boolean }>>;

  initialize(): Promise<Result<void>>;
  startNetworking(): Promise<Result<void>>;
  stopNetworking(): Promise<Result<void>>;

  getPeers(): Promise<Result<PeerDto[]>>;
  sendMessage(message: MessageDto): Promise<Result<DeliveryHandle>>;

  getCurrentLocation(): Promise<Result<LocationDto>>;

  requestRequiredPermissions(): Promise<Result<PermissionState>>;

  subscribe(listener: (event: NativeBridgeEvent) => void): () => void;
}
```

---

## 8. Frontend / Member 4 UI Feature Mapping

| UI Feature / Screen | Primary Engine Contract | Key Methods & DTOs |
| :--- | :--- | :--- |
| **Emergency Report Form** | `DataEngine` + `AIEngine` + `GeoEngine` | `dataEngine.createReport()`, `aiEngine.classifyReport()`, `geoEngine.getCurrentLocation()`, `CreateReportRequest`, `EmergencyReportDto` |
| **Incident List & Detail** | `DataEngine` | `dataEngine.listIncidents()`, `dataEngine.getIncident()`, `dataEngine.calculateConfidence()`, `IncidentDto`, `ConfidenceStateDto` |
| **Interactive Map & Routing** | `GeoEngine` + `DataEngine` | `geoEngine.loadOfflineMap()`, `geoEngine.getHazards()`, `geoEngine.calculateRoute()`, `RouteDto`, `HazardDto`, `LocationDto` |
| **Network & Peer Status** | `NetworkEngine` + `BlackoutNativeBridge` | `networkEngine.getPeers()`, `networkEngine.discoverPeers()`, `networkEngine.subscribe()`, `PeerDto`, `NetworkEvent` |
| **Direct Messaging (DMs)** | `NetworkEngine` + `DataEngine` | `networkEngine.send()`, `dataEngine.saveMessage()`, `MessageDto` (`message_type: "DIRECT"`), `DeliveryStatus` |
| **Resource Directory** | `DataEngine` + `GeoEngine` | `dataEngine.listResources()`, `dataEngine.createResource()`, `geoEngine.findNearby()`, `ResourceDto`, `CreateResourceRequest` |
