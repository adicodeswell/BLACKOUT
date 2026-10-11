import { PeopleService } from "../../src/services/PeopleService";
import { EmergencyReportService } from "../../src/services/EmergencyReportService";
import type { NetworkEngine } from "../../src/contracts/network/NetworkEngine";
import type { DataEngine } from "../../src/contracts/data/DataEngine";
import type { MessageDto, DeliveryHandle, DeliveryStatus } from "../../src/contracts/network/MessageDto";
import type { PeerDto } from "../../src/contracts/network/PeerDto";
import type { NetworkEvent } from "../../src/contracts/network/NetworkEvents";
import type { Result } from "../../src/contracts/common/Result";
import type { ContactDto } from "../../src/contracts/data/ContactDto";
import type { GeoEngine } from "../../src/contracts/geo/GeoEngine";

const delay = (ms: number) => new Promise((resolve) => setTimeout(() => resolve(undefined), ms));

// --- Physical Device Simulation Mocks ---

class PhysicalRadioHub {
  private nodes: Map<string, SimulatedDeviceNode> = new Map();
  // Bidirectional physical radio connectivity matrix: nodeA -> Set of reachable nodes
  public radioRange: Map<string, Set<string>> = new Map();

  register(node: SimulatedDeviceNode) {
    this.nodes.set(node.deviceId, node);
    if (!this.radioRange.has(node.deviceId)) {
      this.radioRange.set(node.deviceId, new Set());
    }
  }

  setInPhysicalProximity(nodeA: string, nodeB: string) {
    this.radioRange.get(nodeA)?.add(nodeB);
    this.radioRange.get(nodeB)?.add(nodeA);
  }

  separateOutOfPhysicalRange(nodeA: string, nodeB: string) {
    this.radioRange.get(nodeA)?.delete(nodeB);
    this.radioRange.get(nodeB)?.delete(nodeA);
  }

  canRadioReach(nodeA: string, nodeB: string): boolean {
    return this.radioRange.get(nodeA)?.has(nodeB) ?? false;
  }

  transmitFrame(senderId: string, recipientId: string, message: MessageDto) {
    if (this.canRadioReach(senderId, recipientId)) {
      const recipient = this.nodes.get(recipientId);
      if (recipient) {
        recipient.receiveSocketFrame(message, senderId);
      }
    }
  }

  broadcastRf(senderId: string, message: MessageDto, excludedId?: string) {
    this.nodes.forEach((node, nodeId) => {
      if (nodeId !== senderId && nodeId !== excludedId) {
        if (this.canRadioReach(senderId, nodeId)) {
          node.receiveSocketFrame(message, senderId);
        }
      }
    });
  }
}

class SimulatedDeviceDataEngine {
  public savedMessages: MessageDto[] = [];
  public contacts: Map<string, ContactDto> = new Map();
  public nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  async saveMessage(msg: MessageDto, state?: "QUEUED" | "SENT" | "RECEIVED" | "DELIVERED"): Promise<Result<void>> {
    if (state) {
      (msg as any)._local_delivery_state = state;
    }
    const existingIndex = this.savedMessages.findIndex(m => m.message_id === msg.message_id);
    if (existingIndex >= 0) {
      this.savedMessages[existingIndex] = msg;
    } else {
      this.savedMessages.push(msg);
    }
    return { ok: true, data: undefined };
  }

  async getMessages(peerId: string): Promise<Result<MessageDto[]>> {
    return {
      ok: true,
      data: this.savedMessages.filter(
        m => m.origin_device_id === peerId || m.destination_device_id === peerId
      ),
    };
  }

  async getPendingOutbound(): Promise<Result<MessageDto[]>> {
    return {
      ok: true,
      data: this.savedMessages.filter(
        m => (m as any)._local_delivery_state === "QUEUED" && m.origin_device_id === this.nodeId
      ),
    };
  }

  async updateDeliveryState(messageId: string, state: "QUEUED" | "SENT" | "DELIVERED" | "FAILED"): Promise<Result<void>> {
    const msg = this.savedMessages.find(m => m.message_id === messageId);
    if (msg) {
      (msg as any)._local_delivery_state = state;
    }
    return { ok: true, data: undefined };
  }

  async getMessage(messageId: string): Promise<Result<MessageDto>> {
    const msg = this.savedMessages.find(m => m.message_id === messageId);
    if (msg) return { ok: true, data: msg };
    return { ok: false, error: { code: "NOT_FOUND", message: "Not found", retryable: false, module: "DATA" } };
  }

  async getAllMessages(): Promise<Result<MessageDto[]>> {
    return { ok: true, data: [...this.savedMessages] };
  }

  async markDelivered(messageId: string, deliveredAt: number): Promise<Result<void>> {
    const msg = this.savedMessages.find(m => m.message_id === messageId);
    if (msg) {
      (msg as any)._local_delivery_state = "DELIVERED";
      (msg as any).delivered_at = deliveredAt;
    }
    return { ok: true, data: undefined };
  }

  async saveContact(contact: ContactDto): Promise<Result<void>> {
    this.contacts.set(contact.peer_id, contact);
    return { ok: true, data: undefined };
  }

  async getContact(peerId: string): Promise<Result<ContactDto>> {
    const contact = this.contacts.get(peerId);
    if (contact) return { ok: true, data: contact };
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Contact not found", retryable: false, module: "DATA" },
    };
  }

  async getAllContacts(): Promise<Result<ContactDto[]>> {
    return { ok: true, data: Array.from(this.contacts.values()) };
  }

  async searchContacts(query: string): Promise<Result<ContactDto[]>> {
    const q = query.toLowerCase();
    const matches = Array.from(this.contacts.values()).filter(
      c => c.peer_id.toLowerCase().includes(q) || (c.name && c.name.toLowerCase().includes(q))
    );
    return { ok: true, data: matches };
  }

  // Stubs for other interface members
  async createReport(): Promise<any> { return { ok: true, data: {} }; }
  async getReport(): Promise<any> { return { ok: true, data: {} }; }
  async getRecentReports(): Promise<any> { return { ok: true, data: [] }; }
  async getAllReports(): Promise<any> { return { ok: true, data: [] }; }
  async updateReportStatus(): Promise<any> { return { ok: true, data: undefined }; }
  async getEmergencyEvents(): Promise<any> { return { ok: true, data: [] }; }
  async saveEmergencyEvent(): Promise<any> { return { ok: true, data: undefined }; }
  async clearAllData(): Promise<any> { return { ok: true, data: undefined }; }
}

class SimulatedDeviceNode implements NetworkEngine {
  public deviceId: string;
  private hub: PhysicalRadioHub;
  public dataEngine: SimulatedDeviceDataEngine;
  public peopleService: PeopleService;
  private listeners: Set<(event: NetworkEvent) => void> = new Set();
  private processedMessageIds: Set<string> = new Set();
  public activeConnections: Set<string> = new Set();

  constructor(hub: PhysicalRadioHub, deviceId: string) {
    this.hub = hub;
    this.deviceId = deviceId;
    this.dataEngine = new SimulatedDeviceDataEngine(deviceId);
    this.peopleService = new PeopleService(this, this.dataEngine as any as DataEngine);
    this.hub.register(this);
  }

  get localNodeId(): string {
    return this.deviceId;
  }

  async start(): Promise<Result<void>> { return { ok: true, data: undefined }; }
  async stop(): Promise<Result<void>> { return { ok: true, data: undefined }; }

  async discoverPeers(): Promise<Result<PeerDto[]>> {
    const peers: PeerDto[] = [];
    this.hub.radioRange.get(this.deviceId)?.forEach(peerId => {
      peers.push({
        peer_id: peerId,
        transport: "WIFI_DIRECT",
        connection_state: this.activeConnections.has(peerId) ? "CONNECTED" : "DISCOVERED",
        last_seen_at: Date.now(),
        capabilities: ["STORE_AND_FORWARD", "GPS"],
      });
    });
    return { ok: true, data: peers };
  }

  async getPeers(): Promise<Result<PeerDto[]>> {
    return this.discoverPeers();
  }

  async connect(peerId: string): Promise<Result<void>> {
    if (!this.hub.canRadioReach(this.deviceId, peerId)) {
      return {
        ok: false,
        error: { code: "CONNECT_FAILED", message: "Out of physical range", retryable: true, module: "NETWORK" },
      };
    }
    this.activeConnections.add(peerId);
    this.notifyPeers({
      type: "PEER_CONNECTED",
      peer: {
        peer_id: peerId,
        transport: "WIFI_DIRECT",
        connection_state: "CONNECTED",
        last_seen_at: Date.now(),
        capabilities: ["STORE_AND_FORWARD", "GPS"],
      },
    });
    return { ok: true, data: undefined };
  }

  async disconnect(peerId: string): Promise<Result<void>> {
    this.activeConnections.delete(peerId);
    this.notifyPeers({ type: "PEER_DISCONNECTED", peer_id: peerId });
    return { ok: true, data: undefined };
  }

  async send(message: MessageDto): Promise<Result<DeliveryHandle>> {
    const dest = message.destination_device_id;
    if (dest && this.activeConnections.has(dest)) {
      this.hub.transmitFrame(this.deviceId, dest, message);
      return { ok: true, data: { message_id: message.message_id, accepted_at: Date.now(), status: "SENT" } };
    }
    // If no direct socket, relay to active mesh neighbors
    if (this.activeConnections.size > 0) {
      this.activeConnections.forEach(neighbor => {
        this.hub.transmitFrame(this.deviceId, neighbor, message);
      });
      return { ok: true, data: { message_id: message.message_id, accepted_at: Date.now(), status: "SENT" } };
    }
    // Offline - queued
    return { ok: true, data: { message_id: message.message_id, accepted_at: Date.now(), status: "QUEUED" } };
  }

  async broadcast(message: MessageDto): Promise<Result<DeliveryHandle>> {
    this.hub.broadcastRf(this.deviceId, message);
    return { ok: true, data: { message_id: message.message_id, accepted_at: Date.now(), status: "SENT" } };
  }

  async getDeliveryStatus(messageId: string): Promise<Result<DeliveryStatus>> {
    const msg = this.dataEngine.savedMessages.find(m => m.message_id === messageId);
    const state = (msg as any)?._local_delivery_state || "QUEUED";
    return {
      ok: true,
      data: { message_id: messageId, state, updated_at: Date.now(), attempts: 1 },
    };
  }

  subscribe(listener: (event: NetworkEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyPeers(event: NetworkEvent) {
    this.listeners.forEach(l => l(event));
  }

  receiveSocketFrame(message: MessageDto, senderPeerId: string) {
    if (this.processedMessageIds.has(message.message_id)) return;
    this.processedMessageIds.add(message.message_id);

    // Save contact into contact book
    this.dataEngine.saveContact({
      peer_id: message.origin_device_id,
      name: `User #${message.origin_device_id.slice(-4).toUpperCase()}`,
      transport: "WIFI_DIRECT",
      last_seen_at: Date.now(),
    });

    // Check if this packet is for us
    if (message.destination_device_id === this.deviceId) {
      // It's for us!
      this.dataEngine.saveMessage(message, "RECEIVED");
      this.notifyPeers({ type: "MESSAGE_RECEIVED", message });

      // If it's a DIRECT message, auto-generate reverse delivery ACK back to origin!
      if (message.message_type === "DIRECT") {
        const ackMessage: MessageDto = {
          protocol_version: 1,
          message_id: "ack_" + message.message_id,
          origin_device_id: this.deviceId,
          destination_device_id: message.origin_device_id,
          message_type: "ACK",
          created_at: Date.now(),
          ttl: 15,
          hop_count: 0,
          priority: "NORMAL",
          payload_hash: "",
          payload: { ack_to: message.message_id },
          signature: "",
        };
        // Send ACK back through the mesh
        this.send(ackMessage);
      } else if (message.message_type === "ACK") {
        // We received an ACK for a message we previously sent!
        const ackTo = (message.payload as any)?.ack_to;
        if (ackTo) {
          this.dataEngine.updateDeliveryState(ackTo, "DELIVERED");
          this.notifyPeers({
            type: "MESSAGE_DELIVERY_UPDATED",
            status: { message_id: ackTo, state: "DELIVERED", updated_at: Date.now(), attempts: 1 },
          });
        }
      }
      return;
    }

    // It's not for us - intermediate store-and-forward relay!
    if (message.ttl > message.hop_count) {
      const forwarded: MessageDto = {
        ...message,
        hop_count: message.hop_count + 1,
      };
      // Relay to active connections except sender
      this.activeConnections.forEach(conn => {
        if (conn !== senderPeerId) {
          this.hub.transmitFrame(this.deviceId, conn, forwarded);
        }
      });
    }
  }
}

describe("Physical Device Acceptance Verification Suite", () => {
  let hub: PhysicalRadioHub;
  let phoneA: SimulatedDeviceNode; // Alice (UUID: 8a4f1001)
  let phoneB: SimulatedDeviceNode; // Bob   (UUID: 8a4f2002)
  let phoneC: SimulatedDeviceNode; // Charlie (UUID: 8a4f3003)

  beforeEach(() => {
    hub = new PhysicalRadioHub();
    phoneA = new SimulatedDeviceNode(hub, "8a4f-device-alice-0001");
    phoneB = new SimulatedDeviceNode(hub, "8a4f-device-bob-0002");
    phoneC = new SimulatedDeviceNode(hub, "8a4f-device-charlie-0003");
  });

  it("Acceptance 1: 2-Phone Physical Direct Message & Reverse ACK Flow", async () => {
    // 1. Phone A and Phone B come into physical Wi-Fi Direct proximity
    hub.setInPhysicalProximity(phoneA.deviceId, phoneB.deviceId);

    // 2. Discover each other and establish connection
    const discoverRes = await phoneA.discoverPeers();
    expect(discoverRes.ok).toBe(true);
    const discoveredPeers = (discoverRes as any).data as PeerDto[];
    expect(discoveredPeers.some((p: PeerDto) => p.peer_id === phoneB.deviceId)).toBe(true);

    await phoneA.connect(phoneB.deviceId);
    await phoneB.connect(phoneA.deviceId);

    // 3. Alice sends a direct message to Bob
    const sendRes = await phoneA.peopleService.sendDirectMessage(phoneB.deviceId, "Hey Bob, physical test message 1");
    expect(sendRes.ok).toBe(true);
    const sentMsg = (sendRes as any).data as MessageDto;

    await delay(50);

    // 4. Bob receives message and persists it
    const bobConvo = phoneB.peopleService.getConversation(phoneA.deviceId);
    expect(bobConvo.length).toBe(1);
    expect((bobConvo[0].payload as any).text).toBe("Hey Bob, physical test message 1");

    // 5. Reverse ACK generated by Bob arrives at Alice, updating status to DELIVERED
    const aliceConvo = phoneA.peopleService.getConversation(phoneB.deviceId);
    expect(aliceConvo[0]._local_delivery_state).toBe("DELIVERED");

    // 6. Bob replies to Alice (B -> A)
    const replyRes = await phoneB.peopleService.sendDirectMessage(phoneA.deviceId, "Received Alice! 5 by 5.");
    expect(replyRes.ok).toBe(true);

    await delay(50);

    // 7. Alice receives reply, Bob's message updates to DELIVERED
    const aliceConvoAfterReply = phoneA.peopleService.getConversation(phoneB.deviceId);
    expect(aliceConvoAfterReply.length).toBe(2);
    expect((aliceConvoAfterReply[1].payload as any).text).toBe("Received Alice! 5 by 5.");

    const bobConvoAfterReply = phoneB.peopleService.getConversation(phoneA.deviceId);
    expect(bobConvoAfterReply[0]._local_delivery_state).toBe("DELIVERED");
  });

  it("Acceptance 2: Disconnection, Offline Draft Queuing & Reconnection Flush", async () => {
    // 1. Initially out of physical range
    hub.separateOutOfPhysicalRange(phoneA.deviceId, phoneB.deviceId);

    // 2. Alice drafts an offline message to Bob while disconnected
    const draftRes = await phoneA.peopleService.sendDirectMessage(phoneB.deviceId, "Drafted during signal blackout");
    expect(draftRes.ok).toBe(true);
    expect(((draftRes as any).data as MessageDto)?._local_delivery_state).toBe("QUEUED");

    // Bob has NOT received the message yet
    expect(phoneB.peopleService.getConversation(phoneA.deviceId)).toHaveLength(0);

    // 3. Later, devices walk into physical radio range and connect
    hub.setInPhysicalProximity(phoneA.deviceId, phoneB.deviceId);
    await phoneA.connect(phoneB.deviceId);
    await phoneB.connect(phoneA.deviceId);

    // 4. Trigger opportunistic queue flush upon connection
    await phoneA.peopleService.flushQueue();
    await delay(50);

    // 5. Message delivered to Bob after reconnection!
    const bobConvo = phoneB.peopleService.getConversation(phoneA.deviceId);
    expect(bobConvo.length).toBe(1);
    expect((bobConvo[0].payload as any).text).toBe("Drafted during signal blackout");

    // 6. Reverse ACK reaches Alice and marks DELIVERED
    const aliceConvo = phoneA.peopleService.getConversation(phoneB.deviceId);
    expect(aliceConvo[0]._local_delivery_state).toBe("DELIVERED");
  });

  it("Acceptance 3: 3-Phone Multi-Hop Relay (A -> B -> C) when A is out of range of C", async () => {
    // Topology:
    // Alice (A) can reach Bob (B).
    // Bob (B) can reach Charlie (C).
    // Alice CANNOT reach Charlie directly (A and C out of physical radio range).
    hub.setInPhysicalProximity(phoneA.deviceId, phoneB.deviceId);
    hub.setInPhysicalProximity(phoneB.deviceId, phoneC.deviceId);
    hub.separateOutOfPhysicalRange(phoneA.deviceId, phoneC.deviceId);

    // Connect pairs
    await phoneA.connect(phoneB.deviceId);
    await phoneB.connect(phoneA.deviceId);
    await phoneB.connect(phoneC.deviceId);
    await phoneC.connect(phoneB.deviceId);

    // Alice sends a message to Charlie (through Bob as relay)
    const sendRes = await phoneA.peopleService.sendDirectMessage(phoneC.deviceId, "Relayed SOS check across 2 hops");
    expect(sendRes.ok).toBe(true);

    await delay(80);

    // Charlie receives the message via Bob!
    const charlieConvo = phoneC.peopleService.getConversation(phoneA.deviceId);
    expect(charlieConvo.length).toBe(1);
    expect((charlieConvo[0].payload as any).text).toBe("Relayed SOS check across 2 hops");

    // Charlie's reverse ACK travels C -> B -> A and confirms delivery on Alice's device!
    const aliceConvo = phoneA.peopleService.getConversation(phoneC.deviceId);
    expect(aliceConvo[0]._local_delivery_state).toBe("DELIVERED");
  });

  it("Acceptance 4: Persistent Contact History and Offline Search", async () => {
    // Save contact directly into Phone A's database
    await phoneA.peopleService.saveContact({
      peer_id: phoneB.deviceId,
      name: "Commander Bob",
      custom_nickname: "Base Camp Lead",
      transport: "WIFI_DIRECT",
      last_seen_at: Date.now(),
    });

    // Offline search by name
    const searchByName = await phoneA.peopleService.searchContacts("Commander");
    expect(searchByName.ok).toBe(true);
    const contactsByName = (searchByName as any).data as ContactDto[];
    expect(contactsByName.length).toBe(1);
    expect(contactsByName[0].peer_id).toBe(phoneB.deviceId);

    // Offline search by UUID substring
    const searchByUuid = await phoneA.peopleService.searchContacts("bob-0002");
    expect(searchByUuid.ok).toBe(true);
    const contactsByUuid = (searchByUuid as any).data as ContactDto[];
    expect(contactsByUuid.length).toBe(1);
    expect(contactsByUuid[0].name).toBe("Commander Bob");
  });
});
