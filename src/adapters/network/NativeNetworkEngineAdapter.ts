import type { NetworkEngine } from "../../contracts/network/NetworkEngine";
import type { Result } from "../../contracts/common/Result";
import type { MessageDto, DeliveryHandle, DeliveryStatus } from "../../contracts/network/MessageDto";
import type { PeerDto } from "../../contracts/network/PeerDto";
import type { NetworkEvent } from "../../contracts/network/NetworkEvents";
import { NativeBridgeAdapter } from "../native/NativeBridgeAdapter";

/**
 * NativeNetworkEngineAdapter - Connects TypeScript NetworkEngine contract
 * to native Android P2P mesh network engine via NativeBridgeAdapter / BlackoutNativeModule.
 */
export class NativeNetworkEngineAdapter implements NetworkEngine {
  private readonly bridge: NativeBridgeAdapter;

  constructor(bridgeAdapter?: NativeBridgeAdapter) {
    this.bridge = bridgeAdapter || new NativeBridgeAdapter();
  }

  async start(): Promise<Result<void>> {
    const initRes = await this.bridge.initialize();
    if (!initRes.ok) {
      return initRes;
    }
    return this.bridge.startNetworking();
  }

  async stop(): Promise<Result<void>> {
    return this.bridge.stopNetworking();
  }

  async discoverPeers(): Promise<Result<PeerDto[]>> {
    try {
      await this.bridge.discoverPeers();
      return this.getPeers();
    } catch (e: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: e.message, retryable: true, module: 'NETWORK' } };
    }
  }

  async getPeers(): Promise<Result<PeerDto[]>> {
    try {
      const peers = await this.bridge.getPeers();
      return { ok: true, data: peers };
    } catch (e: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: e.message, retryable: true, module: 'NETWORK' } };
    }
  }

  async connect(_peerId: string): Promise<Result<void>> {
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED",
        message: "Peer socket connections are managed automatically by AndroidNetworkEngine",
        retryable: false,
        module: "NETWORK",
      },
    };
  }

  async disconnect(_peerId: string): Promise<Result<void>> {
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED",
        message: "Peer socket disconnections are managed automatically by AndroidNetworkEngine",
        retryable: false,
        module: "NETWORK",
      },
    };
  }

  async send(message: MessageDto): Promise<Result<DeliveryHandle>> {
    return this.bridge.sendMessage(message);
  }

  async broadcast(message: MessageDto): Promise<Result<DeliveryHandle>> {
    return this.bridge.sendMessage(message);
  }

  async getDeliveryStatus(_messageId: string): Promise<Result<DeliveryStatus>> {
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED",
        message: "Delivery status querying is not currently exposed by native bridge",
        retryable: false,
        module: "NETWORK",
      },
    };
  }

  subscribe(listener: (event: NetworkEvent) => void): () => void {
    return this.bridge.subscribe((nativeEvent) => {
      if (nativeEvent.type === "NETWORK" && nativeEvent.event) {
        listener(nativeEvent.event);
      }
    });
  }
}
