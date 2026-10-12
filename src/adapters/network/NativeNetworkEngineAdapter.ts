import { PermissionsAndroid, Platform } from 'react-native';

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
  public localNodeId: string = "";
  private readonly bridge: NativeBridgeAdapter;

  constructor(bridgeAdapter?: NativeBridgeAdapter) {
    this.bridge = bridgeAdapter || new NativeBridgeAdapter();
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];
      if (Platform.Version >= 31) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE
        );
      }
      if (Platform.Version >= 33) {
        // Use string directly if NEARBY_WIFI_DEVICES isn't in older RN types
        permissions.push('android.permission.NEARBY_WIFI_DEVICES' as any);
        permissions.push('android.permission.POST_NOTIFICATIONS' as any);
      }
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const fineLoc = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const nearbyWifi = granted['android.permission.NEARBY_WIFI_DEVICES'] === PermissionsAndroid.RESULTS.GRANTED;
      return fineLoc || nearbyWifi || Object.values(granted).some(status => status === PermissionsAndroid.RESULTS.GRANTED);
    } catch (err) {
      console.warn('Failed to request permissions', err);
      return true; // Attempt to proceed even if request fails
    }
  }

  async start(): Promise<Result<void>> {
    const hasPerms = await this.requestPermissions();
    if (!hasPerms) {
      return { ok: false, error: { code: "PERMISSION_DENIED", message: "Required Android permissions were denied. Cannot start mesh networking.", retryable: false, module: "NETWORK" } };
    }
    const initRes = await this.bridge.initialize();
      if (initRes.ok && initRes.data) {
        this.localNodeId = initRes.data;
      }
    if (!initRes.ok) {
      return initRes;
    }
    return this.bridge.startNetworking();
  }

  async connect(address: string): Promise<Result<void>> {
    if ((this.bridge as any).connect) return (this.bridge as any).connect(address);
    return { ok: true, data: undefined };
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

  async getDeliveryStatus(messageId: string): Promise<Result<DeliveryStatus>> {
    const res = await this.bridge.getDeliveryStatus(messageId);
    if (res.ok && res.data) {
      return { ok: true, data: res.data };
    }
    if (!res.ok) {
      return { ok: false, error: res.error };
    }
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: `Delivery status for message ${messageId} not found`,
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
