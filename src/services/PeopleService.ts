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
  private networkEngine: NetworkEngine;
  private dataEngine?: DataEngine;
  private conversations: Map<string, MessageDto[]> = new Map();
  private messageListeners: Set<{ peerId?: string; listener: MessageListener }> = new Set();
  private peerListeners: Set<PeerListener> = new Set();
  private activePeers: PeerDto[] = [];

  constructor(networkEngine: NetworkEngine, dataEngine?: DataEngine) {
    this.networkEngine = networkEngine;
    this.dataEngine = dataEngine;

    // Subscribe to incoming network events
    this.networkEngine.subscribe((event: NetworkEvent) => {
      this.handleNetworkEvent(event);
    });
  }

  private handleNetworkEvent(event: NetworkEvent) {
    if (event.type === "MESSAGE_RECEIVED") {
      const msg = event.message;
      if (msg.message_type === "DIRECT") {
        const peerId = msg.origin_device_id || "unknown-node";
        this.addMessageToConversation(peerId, msg);

        // Optional persist to Room DB
        if (this.dataEngine) {
          this.dataEngine.saveMessage(msg).catch(() => {});
        }
      }
    } else if (event.type === "PEER_CONNECTED" || event.type === "PEER_DISCOVERED") {
      this.refreshPeers();
    } else if (event.type === "PEER_DISCONNECTED") {
      this.activePeers = this.activePeers.filter((p) => p.peer_id !== event.peer_id);
      this.notifyPeerListeners();
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
        error: {
          code: "VALIDATION",
          message: "Message text cannot be empty",
          retryable: false,
          module: "NETWORK",
        },
      };
    }

    const messageDto: MessageDto = {
      protocol_version: 1,
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      origin_device_id: "self-node-01",
      destination_device_id: targetPeerId,
      message_type: "DIRECT",
      created_at: Date.now(),
      ttl: 3,
      hop_count: 0,
      priority: "NORMAL",
      payload_hash: simpleHash(messageText),
      payload: { text: messageText },
      signature: "sig_local_dev",
    };

    // Store locally in conversation immediately
    this.addMessageToConversation(targetPeerId, messageDto);

    // Save to DataEngine if present
    if (this.dataEngine) {
      try {
        await this.dataEngine.saveMessage(messageDto);
      } catch (_err) {
        // Safe fallback
      }
    }

    // Broadcast / send via NetworkEngine
    const sendRes = await this.networkEngine.send(messageDto);
    if (!sendRes.ok) {
      return {
        ok: false,
        error: sendRes.error,
      };
    }

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

  private notifyPeerListeners() {
    this.peerListeners.forEach((listener) => {
      listener(this.activePeers);
    });
  }
}
