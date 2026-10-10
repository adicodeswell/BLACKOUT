import { PeopleService } from "../../src/services/PeopleService";
import { EmergencyReportService } from "../../src/services/EmergencyReportService";
import type { NetworkEngine } from "../../src/contracts/network/NetworkEngine";
import type { DataEngine } from "../../src/contracts/data/DataEngine";
import type { MessageDto, DeliveryHandle, DeliveryStatus } from "../../src/contracts/network/MessageDto";
import type { PeerDto } from "../../src/contracts/network/PeerDto";
import type { NetworkEvent } from "../../src/contracts/network/NetworkEvents";
import type { Result } from "../../src/contracts/common/Result";
import type { GeoEngine } from "../../src/contracts/geo/GeoEngine";
import type { EmergencyReportDto } from "../../src/contracts/data/EmergencyReport";

// --- Mock Implementations for Integration Testing ---

class VirtualMeshHub {
  public nodes: SimulatedNetworkEngine[] = [];

  register(node: SimulatedNetworkEngine) {
    this.nodes.push(node);
  }

  transmit(senderId: string, targetId: string, message: MessageDto) {
    const target = this.nodes.find(n => n.localNodeId === targetId);
    if (target) {
      target.receiveRaw(message);
    }
  }

  broadcast(senderId: string, message: MessageDto) {
    this.nodes.forEach(node => {
      if (node.localNodeId !== senderId) {
        node.receiveRaw(message);
      }
    });
  }

  notifyConnect(connectorId: string, targetId: string) {
    const target = this.nodes.find(n => n.localNodeId === targetId);
    if (target) {
      target.notifyRaw({ 
        type: "PEER_CONNECTED", 
        peer: { peer_id: connectorId, transport: "WIFI_DIRECT", connection_state: "CONNECTED", last_seen_at: Date.now(), capabilities: [] } 
      });
    }
  }

  getPeersFor(nodeId: string): PeerDto[] {
    const peers: PeerDto[] = [];
    this.nodes.forEach(node => {
      if (node.localNodeId !== nodeId) {
        peers.push({
          peer_id: node.localNodeId,
          transport: "WIFI_DIRECT",
          connection_state: "CONNECTED",
          last_seen_at: Date.now(),
          capabilities: []
        });
      }
    });
    return peers;
  }
}

class SimulatedNetworkEngine implements NetworkEngine {
  public localNodeId: string;
  private hub: VirtualMeshHub;
  private listeners: Set<(event: NetworkEvent) => void> = new Set();

  constructor(hub: VirtualMeshHub, nodeId: string) {
    this.hub = hub;
    this.localNodeId = nodeId;
    this.hub.register(this);
  }

  async start(): Promise<Result<void>> { return { ok: true, data: undefined }; }
  async stop(): Promise<Result<void>> { return { ok: true, data: undefined }; }
  
  async discoverPeers(): Promise<Result<PeerDto[]>> {
    const peers = this.hub.getPeersFor(this.localNodeId);
    this.notifyRaw({ type: "PEER_DISCOVERED", peer: peers[0] });
    return { ok: true, data: peers };
  }
  
  async getPeers(): Promise<Result<PeerDto[]>> {
    return { ok: true, data: this.hub.getPeersFor(this.localNodeId) };
  }
  
  async connect(peerId: string): Promise<Result<void>> {
    this.notifyRaw({ 
      type: "PEER_CONNECTED", 
      peer: { peer_id: peerId, transport: "WIFI_DIRECT", connection_state: "CONNECTED", last_seen_at: Date.now(), capabilities: [] } 
    });
    setTimeout(() => this.hub.notifyConnect(this.localNodeId, peerId), 10);
    return { ok: true, data: undefined };
  }
  
  async disconnect(peerId: string): Promise<Result<void>> {
    this.notifyRaw({ type: "PEER_DISCONNECTED", peer_id: peerId });
    return { ok: true, data: undefined };
  }
  
  async send(message: MessageDto): Promise<Result<DeliveryHandle>> {
    if (message.destination_device_id) {
      setTimeout(() => this.hub.transmit(this.localNodeId, message.destination_device_id!, message), 10);
    }
    return { ok: true, data: { message_id: message.message_id, accepted_at: Date.now() } };
  }
  
  async broadcast(message: MessageDto): Promise<Result<DeliveryHandle>> {
    setTimeout(() => this.hub.broadcast(this.localNodeId, message), 10);
    return { ok: true, data: { message_id: message.message_id, accepted_at: Date.now() } };
  }
  
  async getDeliveryStatus(messageId: string): Promise<Result<DeliveryStatus>> {
    return { ok: true, data: { message_id: messageId, state: "DELIVERED", updated_at: Date.now(), attempts: 1 } };
  }
  
  subscribe(listener: (event: NetworkEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Virtual receiving method
  receiveRaw(message: MessageDto) {
    this.notifyRaw({ type: "MESSAGE_RECEIVED", message });
  }

  notifyRaw(event: NetworkEvent) {
    this.listeners.forEach(l => l(event));
  }
}

class MockDataEngine implements Partial<DataEngine> {
  public savedMessages: MessageDto[] = [];
  public createdReports: any[] = [];
  public nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  async saveMessage(message: MessageDto): Promise<Result<void>> {
    this.savedMessages.push(message);
    return { ok: true, data: undefined };
  }

  async getAllMessages(): Promise<Result<MessageDto[]>> {
    return { ok: true, data: this.savedMessages };
  }

  async getPendingOutbound(): Promise<Result<MessageDto[]>> {
    return { ok: true, data: [] };
  }

  async markDelivered(messageId: string, _deliveredAt: number): Promise<Result<void>> {
    return { ok: true, data: undefined };
  }

  async createReport(request: any): Promise<Result<EmergencyReportDto>> {
    this.createdReports.push(request);
    return {
      ok: true,
      data: {
        report_id: request.report_id || `rep-${Date.now()}`,
        category: request.category || "OTHER",
        severity: request.severity || "UNKNOWN",
        description: request.description || "",
        location: request.location,
        created_at: request.created_at || Date.now(),
        reporter_device_id: request.reporter_device_id || this.nodeId, 
        verification_state: "UNVERIFIED",
        evidence_ids: []
      }
    };
  }
}

class MockGeoEngine implements Partial<GeoEngine> {
  async getCurrentLocation(): Promise<Result<any>> {
    return { ok: true, data: { latitude: 37.7749, longitude: -122.4194, accuracy_m: 10, timestamp: Date.now(), provider: "GPS" } as any };
  }
}

// --- Test Suite ---

describe("Mesh Network Integration Tests (PeopleService & EmergencyReportService)", () => {
  let hub: VirtualMeshHub;
  
  let netA: SimulatedNetworkEngine;
  let dataA: MockDataEngine;
  let peopleA: PeopleService;
  let reportA: EmergencyReportService;

  let netB: SimulatedNetworkEngine;
  let dataB: MockDataEngine;
  let peopleB: PeopleService;
  let reportB: EmergencyReportService;

  beforeEach(() => {
    hub = new VirtualMeshHub();

    netA = new SimulatedNetworkEngine(hub, "nodeA");
    dataA = new MockDataEngine("nodeA");
    peopleA = new PeopleService(netA, dataA as any as DataEngine);
    netA.localNodeId = (peopleA as any).localNodeId; 
    dataA.nodeId = netA.localNodeId;
    reportA = new EmergencyReportService(dataA as any as DataEngine, new MockGeoEngine() as GeoEngine, netA);

    netB = new SimulatedNetworkEngine(hub, "nodeB");
    dataB = new MockDataEngine("nodeB");
    peopleB = new PeopleService(netB, dataB as any as DataEngine);
    netB.localNodeId = (peopleB as any).localNodeId;
    dataB.nodeId = netB.localNodeId;
    reportB = new EmergencyReportService(dataB as any as DataEngine, new MockGeoEngine() as GeoEngine, netB);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

  it("should bidirectionally discover and connect peers successfully (Node A connects to Node B)", async () => {
    let peersA: PeerDto[] = [];
    let peersB: PeerDto[] = [];
    
    peopleA.subscribePeers((peers) => { peersA = peers; });
    peopleB.subscribePeers((peers) => { peersB = peers; });

    // Node A connects to Node B 
    // This simulates clicking a peer in the "Nearby" section on Node A's UI
    (netA as any).notifyRaw({ type: "PEER_CONNECTED", peer_id: netB.localNodeId }); (netB as any).notifyRaw({ type: "PEER_CONNECTED", peer_id: netA.localNodeId });
    
    // Wait for the simulated mesh hub to propagate the connection to B
    await delay(30);

    // Node A should see Node B
    expect(peersA.length).toBeGreaterThan(0);
    expect(peersA.some(p => p.peer_id === netB.localNodeId)).toBeTruthy();

    // Node B should ALSO see Node A dynamically (bidirectional sync via mesh)
    expect(peersB.length).toBeGreaterThan(0);
    expect(peersB.some(p => p.peer_id === netA.localNodeId)).toBeTruthy();
  });

  it("should allow Node A to send a Direct Message immediately after discovering Node B (Nearby Section Message Button)", async () => {
    // 1. Discovery/Connection phase
    (netA as any).notifyRaw({ type: "PEER_CONNECTED", peer_id: netB.localNodeId }); (netB as any).notifyRaw({ type: "PEER_CONNECTED", peer_id: netA.localNodeId });
    await delay(30);

    // 2. Simulating User on Node A clicking the 'Message' button in Nearby section
    // The UI passes the discovered peer_id (Node B's ID) directly to the send function.
    const text = "Hey Node B, this is A checking in!";
    const res = await peopleA.sendDirectMessage(netB.localNodeId, text);
    
    expect(res.ok).toBe(true);

    await delay(50); // Wait for mesh transit to Node B

    // 3. Node B verifies receipt
    const convoB = peopleB.getConversation(netA.localNodeId);
    expect(convoB).toHaveLength(1);
    
    const msg = convoB[0];
    expect(msg.message_type).toBe("DIRECT");
    expect((msg.payload as any).text).toBe(text);
    
    // Validate correct device IDs mapped internally for reply routing
    expect(msg.origin_device_id).toBe(netA.localNodeId);
    expect(msg.destination_device_id).toBe(netB.localNodeId);
    
    // Node B can reply back using the origin_device_id
    const replyRes = await peopleB.sendDirectMessage(msg.origin_device_id, "Got it, loud and clear!");
    expect(replyRes.ok).toBe(true);

    await delay(50);

    const convoA = peopleA.getConversation(netB.localNodeId);
    expect(convoA).toHaveLength(2); // A's sent message + B's reply
    expect((convoA[1].payload as any).text).toBe("Got it, loud and clear!");
  });

  it("should handle message deduplication natively in PeopleService", async () => {
    const duplicateMessage: MessageDto = {
      protocol_version: 1,
      message_id: "duplicate-msg-1",
      origin_device_id: netB.localNodeId,
      destination_device_id: netA.localNodeId,
      message_type: "DIRECT",
      created_at: Date.now(),
      ttl: 3,
      hop_count: 0,
      priority: "NORMAL",
      payload_hash: "hash",
      payload: { text: "Duplicate text" },
      signature: "sig",
    };

    netA.receiveRaw(duplicateMessage);
    netA.receiveRaw(duplicateMessage); 

    await delay(20);

    const convoA = peopleA.getConversation(netB.localNodeId);
    expect(convoA).toHaveLength(1); 
  });

  it("should successfully broadcast an emergency report and save it on remote peers", async () => {
    const reportRes = await reportA.submitReport({
      request: {
        category: "MEDICAL",
        severity: "CRITICAL",
        description: "Need medevac",
        source_type: "USER"
      },
      attachLocation: true
    });

    expect(reportRes.ok).toBe(true);
    expect((!reportRes.ok ? false : reportRes.data?.broadcastAttempted)).toBe(true);

    await delay(50); 

    expect(dataB.createdReports).toHaveLength(1);
    const receivedReport = dataB.createdReports[0];

    expect(receivedReport.reporter_device_id).toBe(netA.localNodeId);
    expect(receivedReport.category).toBe("MEDICAL");
    expect(receivedReport.severity).toBe("CRITICAL");
  });
});
