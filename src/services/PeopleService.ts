import type { NetworkEngine } from "../contracts/network/NetworkEngine";
import type { DataEngine } from "../contracts/data/DataEngine";
import type { MessageDto } from "../contracts/network/MessageDto";
import type { PeerDto } from "../contracts/network/PeerDto";
import type { NetworkEvent } from "../contracts/network/NetworkEvents";
import type { Result } from "../contracts/common/Result";

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

export type MessageListener = (message: MessageDto) => void;
export type PeerListener = (peers: PeerDto[]) => void;

export class PeopleService {
  private _fallbackNodeId = "node_" + Math.random().toString(36).substring(2, 9);
  public get localNodeId(): string {
    return (this.networkEngine as any).localNodeId || this._fallbackNodeId;
  }
  private networkEngine: NetworkEngine;
  private dataEngine?: DataEngine;
  private conversations: Map<string, MessageDto[]> = new Map();
  private messageListeners: Set<{ peerId?: string; listener: MessageListener }> = new Set();
  private peerListeners: Set<PeerListener> = new Set();
  private activePeers: PeerDto[] = [];

  constructor(networkEngine: NetworkEngine, dataEngine?: DataEngine) {
    this.networkEngine = networkEngine;
    setTimeout(() => this.loadHistory(), 500);
    // Let NetworkEngine manage the canonical ID
    this.dataEngine = dataEngine;

    // Subscribe to incoming network events
    this.networkEngine.subscribe((event: NetworkEvent) => {
      this.handleNetworkEvent(event);
    });
  }

  private handleNetworkEvent(event: NetworkEvent) {
    if (event.type === "PEER_CONNECTED") {
      this.refreshPeers();
      this.flushQueue();
    } else if (event.type === "PEER_DISCONNECTED") {
      this.refreshPeers();
    }
    if (event.type === "MESSAGE_RECEIVED") {
      const msg = event.message;
      if (msg.message_type === "ACK" && msg.payload) {
        const ackTo = (msg.payload as any).ack_to;
        if (ackTo && this.dataEngine) {
          this.dataEngine.getMessage(ackTo).then((res) => {
            if (res.ok && res.data && res.data.destination_device_id === msg.origin_device_id) {
              this.dataEngine!.markDelivered(ackTo, Date.now()).catch(() => {});
              // Update in-memory state
              this.conversations.forEach((list, peerId) => {
                const m = list.find(x => x.message_id === ackTo);
                if (m) {
                  (m as any)._local_delivery_state = 'DELIVERED';
                  this.notifyMessageListeners(peerId, m);
                }
              });
            }
          });
        }
      }

      if (msg.message_type === "DIRECT" || msg.message_type === "BROADCAST") {
        const peerId = msg.origin_device_id || "unknown-node";
        
        const processAndAck = () => {
          this.addMessageToConversation(peerId, msg);
          if (msg.message_type === "DIRECT" && msg.origin_device_id) {
             const ackMsg: MessageDto = {
               protocol_version: 1,
               message_id: "ack_" + msg.message_id,
               origin_device_id: this.localNodeId,
               destination_device_id: msg.origin_device_id,
               message_type: "ACK",
               created_at: Date.now(),
               ttl: 1, hop_count: 0, priority: "NORMAL",
               payload_hash: "", payload: { ack_to: msg.message_id }, signature: ""
             };
             this.networkEngine.send(ackMsg);
          }
        };

        if (this.dataEngine) {
          this.dataEngine.saveMessage(msg).then((res) => {
            if (res.ok) {
              processAndAck();
            } else {
              // Persistence failed: do not ACK.
            }
          }).catch(() => {
            // Unexpected error: do not ACK.
            return;
          });
        } else {
          processAndAck();
        }
      }
    } else if (event.type === "PEER_CONNECTED" || event.type === "PEER_DISCOVERED") {
      this.refreshPeers();
    } else if (event.type === "PEER_DISCONNECTED") {
      this.activePeers = this.activePeers.filter((p) => p.peer_id !== event.peer_id);
      this.notifyPeerListeners();
    }
  }

  public async loadHistory() {
    if (this.dataEngine) {
      const res = await this.dataEngine.getAllMessages();
      if (res.ok) {
        res.data.forEach(msg => {
          const peerId = msg.origin_device_id === this.localNodeId ? msg.destination_device_id : msg.origin_device_id;
          if (peerId) this.addMessageToConversation(peerId, msg);
        });
      }
    }
  }

  private addMessageToConversation(peerId: string, message: MessageDto) {
    const list = this.conversations.get(peerId) || [];
    // Avoid duplicates
    if (!list.some((m) => m.message_id === message.message_id)) {
      list.push(message);
      // Sort by created_at ascending
      list.sort((a, b) => a.created_at - b.created_at);
      this.conversations.set(peerId, list);
      this.notifyMessageListeners(peerId, message);
    }
  }

  async connectToPeer(address: string): Promise<Result<void>> {
    return this.networkEngine.connect(address);
  }

  async getPeers(): Promise<Result<PeerDto[]>> {
    const res = await this.networkEngine.getPeers();
    if (res.ok) {
      this.activePeers = res.data;
      this.notifyPeerListeners();
    }
    return res;
  }

  private async refreshPeers() {
    const res = await this.networkEngine.getPeers();
    if (res.ok) {
      this.activePeers = res.data;
      this.notifyPeerListeners();
    }
  }

  getConversation(peerId: string): MessageDto[] {
    return this.conversations.get(peerId) || [];
  }

  getConversationsList(): { peerId: string; lastMessage: MessageDto; unreadCount: number }[] {
    const list: { peerId: string; lastMessage: MessageDto; unreadCount: number }[] = [];
    this.conversations.forEach((messages, peerId) => {
      if (messages.length > 0) {
        list.push({
          peerId,
          lastMessage: messages[messages.length - 1],
          unreadCount: 0,
        });
      }
    });
    return list.sort((a, b) => b.lastMessage.created_at - a.lastMessage.created_at);
  }

  async sendDirectMessage(targetPeerId: string, text: string): Promise<Result<MessageDto>> {
    const messageText = text.trim();
    if (!messageText) {
      return {
        ok: false,
        error: { code: "VALIDATION", message: "Message text cannot be empty", retryable: false, module: "NETWORK" },
      };
    }
    
    if (targetPeerId.includes(":") || targetPeerId.startsWith("TEMP-")) {
      return {
        ok: false,
        error: { code: "UNRESOLVED_IDENTITY", message: "Cannot send to an unresolved or temporary peer identity. Please wait for the connection to fully establish.", retryable: false, module: "NETWORK" },
      };
    }

    const messageDto: MessageDto = {
      protocol_version: 1,
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      origin_device_id: this.localNodeId,
      destination_device_id: targetPeerId,
      message_type: "DIRECT",
      created_at: Date.now(),
      ttl: 3,
      hop_count: 0,
      priority: "NORMAL",
      payload_hash: simpleHash(messageText),
      payload: { text: messageText },
      signature: "", // Security placeholder removed
    };

    // Store locally in conversation immediately
    (messageDto as any)._local_delivery_state = 'QUEUED';
    this.addMessageToConversation(targetPeerId, messageDto);

    // Save to DataEngine if present
    if (this.dataEngine) {
      try {
        const dbResult = await this.dataEngine.saveMessage(messageDto);
        if (!dbResult.ok) {
          (messageDto as any)._local_delivery_state = 'FAILED';
          this.notifyMessageListeners(targetPeerId, messageDto);
          return { ok: false, error: dbResult.error };
        }
      } catch (err) {
        (messageDto as any)._local_delivery_state = 'FAILED';
        this.notifyMessageListeners(targetPeerId, messageDto);
        return { ok: false, error: { code: "STORAGE", message: String(err), retryable: false, module: "DATA" } };
      }
    }

    // Broadcast / send via NetworkEngine
    const sendRes = await this.networkEngine.send(messageDto);
    if (!sendRes.ok) {
      (messageDto as any)._local_delivery_state = 'FAILED';
      this.notifyMessageListeners(targetPeerId, messageDto);
      return {
        ok: false,
        error: sendRes.error,
      };
    }

    (messageDto as any)._local_delivery_state = 'SENT';
    this.notifyMessageListeners(targetPeerId, messageDto);
    return { ok: true, data: messageDto };
  }

  subscribePeers(listener: PeerListener): () => void {
    this.peerListeners.add(listener);
    listener(this.activePeers);
    return () => {
      this.peerListeners.delete(listener);
    };
  }

  subscribeMessages(peerId: string, listener: MessageListener): () => void {
    const entry = { peerId, listener };
    this.messageListeners.add(entry);
    return () => {
      this.messageListeners.delete(entry);
    };
  }

  private notifyMessageListeners(peerId: string, message: MessageDto) {
    this.messageListeners.forEach((entry) => {
      if (!entry.peerId || entry.peerId === peerId) {
        entry.listener(message);
      }
    });
  }

  private async flushQueue() {
    if (!this.dataEngine) return;
    const pendingRes = await this.dataEngine.getPendingOutbound();
    if (pendingRes.ok && pendingRes.data.length > 0) {
      for (const msg of pendingRes.data) {
        // Attempt to resend
        let sendRes;
        if (msg.message_type === "DIRECT" && msg.destination_device_id) {
          sendRes = await this.networkEngine.send(msg);
        } else {
          sendRes = await this.networkEngine.broadcast(msg);
        }
        
        if (sendRes && sendRes.ok) {
          (msg as any)._local_delivery_state = 'SENT';
          if (msg.destination_device_id) {
            this.notifyMessageListeners(msg.destination_device_id, msg);
          }
        }
      }
    }
  }

  private notifyPeerListeners() {
    this.peerListeners.forEach((listener) => {
      listener(this.activePeers);
    });
  }
}
