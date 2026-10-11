import type { NetworkEngine } from "../contracts/network/NetworkEngine";
import type { DataEngine } from "../contracts/data/DataEngine";
import type { MessageDto } from "../contracts/network/MessageDto";
import type { PeerDto } from "../contracts/network/PeerDto";
import type { NetworkEvent } from "../contracts/network/NetworkEvents";
import type { Result } from "../contracts/common/Result";
import type { ContactDto } from "../contracts/data/ContactDto";

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
export type ContactListener = (contacts: ContactDto[]) => void;

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
  private contactListeners: Set<ContactListener> = new Set();
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
    if (event.type === "PEER_CONNECTED" || event.type === "PEER_DISCOVERED") {
      const peer = (event as any).peer;
      const peerId = peer?.peer_id || (event as any).peer_id;
      const transportAddr = peer?.transport_address;

      // Migrate messages if conversation was previously keyed by transport address (e.g. MAC)
      if (
        peerId &&
        !peerId.startsWith("TEMP-") &&
        !peerId.includes(":") &&
        transportAddr &&
        this.conversations.has(transportAddr)
      ) {
        const oldMsgs = this.conversations.get(transportAddr) || [];
        const canonicalMsgs = this.conversations.get(peerId) || [];
        for (const m of oldMsgs) {
          if (m.destination_device_id === transportAddr) {
            m.destination_device_id = peerId;
          }
          if (m.origin_device_id === transportAddr) {
            m.origin_device_id = peerId;
          }
          if (!canonicalMsgs.some(cm => cm.message_id === m.message_id)) {
            canonicalMsgs.push(m);
          }
        }
        canonicalMsgs.sort((a, b) => a.created_at - b.created_at);
        this.conversations.set(peerId, canonicalMsgs);
        this.conversations.delete(transportAddr);
      }

      if (
        this.dataEngine?.saveContact &&
        peerId &&
        !peerId.startsWith("TEMP-") &&
        !peerId.includes(":")
      ) {
        this.dataEngine
          .saveContact({
            peer_id: peerId,
            name:
              peer?.name ||
              `User #${
                peerId.length > 4
                  ? peerId.slice(-4).toUpperCase()
                  : peerId
              }`,
            transport: peer?.transport === "BLE" ? "BLE" : "WIFI_DIRECT",
            transport_address: peer?.transport_address,
            last_seen_at: Date.now(),
          })
          .then(() => this.notifyContactListeners())
          .catch(() => {});
      }
      this.refreshPeers();
      if (event.type === "PEER_CONNECTED") {
        this.flushQueue().catch(() => {});
      }
    } else if (event.type === "PEER_DISCONNECTED") {
      const peerId = (event as any).peer_id || (event as any).peer?.peer_id;
      if (peerId) {
        this.activePeers = this.activePeers.filter((p) => p.peer_id !== peerId);
      }
      this.notifyPeerListeners();
    } else if (event.type === "MESSAGE_DELIVERY_UPDATED") {
      const { message_id, state } = event.status;
      if (state === "DELIVERED") {
        if (this.dataEngine) {
          this.dataEngine.markDelivered(message_id, event.status.updated_at || Date.now()).catch(() => {});
        }
        this.conversations.forEach((list, peerId) => {
          const m = list.find(x => x.message_id === message_id);
          if (m) {
            (m as any)._local_delivery_state = 'DELIVERED';
            this.notifyMessageListeners(peerId, m);
          }
        });
      }
    }

    if (event.type === "MESSAGE_RECEIVED") {
      const msg = event.message;
      if (msg.message_type === "ACK" && msg.payload) {
        const ackTo = (msg.payload as any).ack_to;
        if (ackTo) {
          const verifyAndMark = (targetDest?: string) => {
            if (targetDest && targetDest !== msg.origin_device_id) {
              // Sender mismatch! ACK origin does not match original message destination.
              return;
            }
            if (this.dataEngine) {
              this.dataEngine.markDelivered(ackTo, Date.now()).catch(() => {});
            }
            // Update in-memory state
            this.conversations.forEach((list, peerId) => {
              const m = list.find(x => x.message_id === ackTo);
              if (m) {
                (m as any)._local_delivery_state = 'DELIVERED';
                this.notifyMessageListeners(peerId, m);
              }
            });
          };

          if (this.dataEngine) {
            this.dataEngine.getMessage(ackTo).then((res) => {
              if (res.ok && res.data) {
                verifyAndMark(res.data.destination_device_id);
              } else {
                let foundDest: string | undefined;
                this.conversations.forEach((list) => {
                  const m = list.find(x => x.message_id === ackTo);
                  if (m) foundDest = m.destination_device_id;
                });
                if (foundDest) {
                  verifyAndMark(foundDest);
                }
              }
            }).catch(() => {});
          } else {
            let foundDest: string | undefined;
            this.conversations.forEach((list) => {
              const m = list.find(x => x.message_id === ackTo);
              if (m) foundDest = m.destination_device_id;
            });
            if (foundDest) {
              verifyAndMark(foundDest);
            }
          }
        }
      }

      if (msg.message_type === "DIRECT" || msg.message_type === "BROADCAST") {
        this.handleIncomingDirectOrBroadcast(msg);
      } else if (msg.message_type === "SYNC" && msg.payload) {
        try {
          const syncPayload = msg.payload as any;
          const items: MessageDto[] = Array.isArray(syncPayload.sync_messages) ? syncPayload.sync_messages : [syncPayload];
          items.forEach(item => {
            if (item && (item.message_type === "DIRECT" || item.message_type === "BROADCAST")) {
              this.handleIncomingDirectOrBroadcast(item);
            }
          });
        } catch (e) {
          console.error("Failed to parse incoming SYNC messages in PeopleService", e);
        }
      }
    }
  }

  private handleIncomingDirectOrBroadcast(msg: MessageDto) {
    const peerId = msg.origin_device_id || "unknown-node";
    (msg as any)._local_delivery_state = 'RECEIVED';

    if (
      this.dataEngine?.saveContact &&
      msg.origin_device_id &&
      !msg.origin_device_id.startsWith("TEMP-") &&
      !msg.origin_device_id.includes(":") &&
      msg.origin_device_id !== this.localNodeId
    ) {
      this.dataEngine
        .saveContact({
          peer_id: msg.origin_device_id,
          name: `User #${
            msg.origin_device_id.length > 4
              ? msg.origin_device_id.slice(-4).toUpperCase()
              : msg.origin_device_id
          }`,
          transport: "WIFI_DIRECT",
          last_seen_at: Date.now(),
        })
        .then(() => this.notifyContactListeners())
        .catch(() => {});
    }
    
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
           ttl: msg.ttl > 0 ? msg.ttl : 15, hop_count: 0, priority: "NORMAL",
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

  public async loadHistory() {
    if (this.dataEngine) {
      const res = await this.dataEngine.getAllMessages();
      if (res.ok) {
        res.data.forEach(msg => {
          if (msg.message_type !== "DIRECT" && msg.message_type !== "BROADCAST") return;
          const peerId = msg.origin_device_id === this.localNodeId ? msg.destination_device_id : msg.origin_device_id;
          if (peerId) this.addMessageToConversation(peerId, msg);
        });
      }
      this.flushQueue().catch(() => {});
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

  async connectToPeer(address: string, onProgress?: (state: 'CONNECTING' | 'HANDSHAKING' | 'CONNECTED') => void): Promise<Result<string>> {
    const existing = this.activePeers.find(p => p.peer_id === address || (p as any).transport_address === address);
    if (existing && existing.connection_state === 'CONNECTED') {
      onProgress?.('CONNECTED');
      return { ok: true, data: existing.peer_id };
    }

    onProgress?.('CONNECTING');

    return new Promise((resolve) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve({ ok: false, error: { code: 'TIMEOUT', message: 'Connection timed out', retryable: true, module: 'NETWORK' }});
      }, 35000);

      const cleanup = this.networkEngine.subscribe((event) => {
        if (resolved) return;

        if (event.type === 'PEER_DISCOVERED' && event.peer.connection_state === 'CONNECTING') {
          onProgress?.('CONNECTING');
        }

        // We use TEMP- as an indicator of handshaking from native side if we emit it,
        // or just rely on CONNECTED.
        if (event.type === 'PEER_DISCOVERED' && event.peer.connection_state === 'HANDSHAKING') {
          onProgress?.('HANDSHAKING');
        }

        if (event.type === 'PEER_CONNECTED' && !event.peer.peer_id.startsWith('TEMP-')) {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          onProgress?.('CONNECTED');
          this.flushQueue().catch(() => {});
          resolve({ ok: true, data: event.peer.peer_id });
        }
      });

      this.networkEngine.connect(address).then(res => {
         if (!res.ok) {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeout);
            cleanup();
            resolve({ ok: false, error: res.error });
         }
      });
    });
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
    
    // Resolve canonical peer ID from alias if known
    let targetDest = targetPeerId;
    const knownPeer = this.activePeers.find(
      (p) => p.peer_id === targetPeerId || p.transport_address === targetPeerId
    );
    if (knownPeer && !knownPeer.peer_id.includes(":") && !knownPeer.peer_id.startsWith("TEMP-")) {
      targetDest = knownPeer.peer_id;
    }

    const messageDto: MessageDto = {
      protocol_version: 1,
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      origin_device_id: this.localNodeId,
      destination_device_id: targetDest,
      message_type: "DIRECT",
      created_at: Date.now(),
      ttl: 15,
      hop_count: 0,
      priority: "NORMAL",
      payload_hash: simpleHash(messageText),
      payload: { text: messageText },
      signature: "", // Security placeholder removed
    };

    // Store locally in conversation immediately as QUEUED
    (messageDto as any)._local_delivery_state = 'QUEUED';
    this.addMessageToConversation(targetPeerId, messageDto);
    if (targetDest !== targetPeerId) {
      this.addMessageToConversation(targetDest, messageDto);
    }

    // Save to DataEngine if present
    if (this.dataEngine) {
      try {
        await this.dataEngine.saveMessage(messageDto);
      } catch (err) {
        console.warn('Failed to persist message to DataEngine', err);
      }
      if (this.dataEngine?.getContact) {
        this.dataEngine.getContact(targetPeerId).then((cRes) => {
          if (!cRes.ok || !cRes.data) {
            this.dataEngine?.saveContact?.({
              peer_id: targetPeerId,
              name: `User #${targetPeerId.length > 4 ? targetPeerId.slice(-4).toUpperCase() : targetPeerId}`,
              transport: "WIFI_DIRECT",
              last_seen_at: Date.now(),
            }).then(() => this.notifyContactListeners()).catch(() => {});
          }
        }).catch(() => {});
      }
    }

    // Broadcast / send via NetworkEngine
    try {
      const sendRes = await this.networkEngine.send(messageDto);
      if (sendRes.ok) {
        const handle = sendRes.data as any;
        const isSent = !handle?.status || handle.status === 'SENT';
        if (isSent) {
          if ((messageDto as any)._local_delivery_state !== 'DELIVERED') {
            (messageDto as any)._local_delivery_state = 'SENT';
          }
          if (this.dataEngine && this.dataEngine.updateDeliveryState) {
            await this.dataEngine.updateDeliveryState(messageDto.message_id, (messageDto as any)._local_delivery_state).catch(() => {});
          }
        } else {
          (messageDto as any)._local_delivery_state = 'QUEUED';
        }
      } else {
        (messageDto as any)._local_delivery_state = 'QUEUED';
      }
    } catch {
      (messageDto as any)._local_delivery_state = 'QUEUED';
    }

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

  subscribeMessages(peerId: string | undefined, listener: MessageListener): () => void {
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

  public async flushQueue() {
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
          const handle = sendRes.data as any;
          const isSent = !handle?.status || handle.status === 'SENT';
          if (isSent) {
            if ((msg as any)._local_delivery_state !== 'DELIVERED') {
              (msg as any)._local_delivery_state = 'SENT';
            }
            if (this.dataEngine && this.dataEngine.updateDeliveryState) {
              await this.dataEngine.updateDeliveryState(msg.message_id, (msg as any)._local_delivery_state).catch(() => {});
            }
            // Update in-memory state in conversations
            const peerId = msg.destination_device_id || msg.origin_device_id;
            if (peerId) {
              const list = this.conversations.get(peerId);
              if (list) {
                const found = list.find((m) => m.message_id === msg.message_id);
                if (found && (found as any)._local_delivery_state !== 'DELIVERED') {
                  found._local_delivery_state = 'SENT';
                }
              }
              this.notifyMessageListeners(peerId, msg);
            }
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

  async saveContact(contact: ContactDto): Promise<Result<void>> {
    if (this.dataEngine) {
      const res = await this.dataEngine.saveContact(contact);
      this.notifyContactListeners();
      return res;
    }
    return { ok: true, data: undefined };
  }

  async getContact(peerId: string): Promise<Result<ContactDto>> {
    if (this.dataEngine) {
      return this.dataEngine.getContact(peerId);
    }
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: `Contact not found: ${peerId}`, retryable: false, module: "DATA" },
    };
  }

  async getAllContacts(): Promise<Result<ContactDto[]>> {
    if (this.dataEngine) {
      return this.dataEngine.getAllContacts();
    }
    return { ok: true, data: [] };
  }

  async searchContacts(query: string): Promise<Result<ContactDto[]>> {
    if (this.dataEngine && this.dataEngine.searchContacts) {
      return this.dataEngine.searchContacts(query);
    }
    if (this.dataEngine) {
      const res = await this.dataEngine.getAllContacts();
      if (res.ok) {
        const q = query.toLowerCase();
        const filtered = res.data.filter((c) =>
          c.peer_id.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.custom_nickname && c.custom_nickname.toLowerCase().includes(q))
        );
        return { ok: true, data: filtered };
      }
    }
    return { ok: true, data: [] };
  }

  subscribeContacts(listener: ContactListener): () => void {
    this.contactListeners.add(listener);
    this.getAllContacts()
      .then((res) => {
        if (res.ok) listener(res.data);
      })
      .catch(() => {});
    return () => {
      this.contactListeners.delete(listener);
    };
  }

  private async notifyContactListeners() {
    if (this.contactListeners.size === 0) return;
    const res = await this.getAllContacts();
    if (res.ok) {
      this.contactListeners.forEach((listener) => listener(res.data));
    }
  }
}

