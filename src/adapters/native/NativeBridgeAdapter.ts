import { NativeModules, NativeEventEmitter } from 'react-native';
import type { Result } from "../../contracts/common/Result";
import type { MessageDto, DeliveryHandle } from "../../contracts/network/MessageDto";
import type { NativeBridgeEvent } from "../../contracts/events/NativeEvents";
import type { BlackoutError } from "../../contracts/common/BlackoutError";

const { BlackoutNativeModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(BlackoutNativeModule);

function mapError(error: any): BlackoutError {
  return {
    code: "TRANSPORT",
    message: error?.message || String(error) || "Unknown native bridge error",
    retryable: true,
    module: "NETWORK"
  };
}

export class NativeBridgeAdapter {
  async pingNative(): Promise<{ ok: boolean; data?: any; error?: any }> {
    try {
      const data = await BlackoutNativeModule.pingNative();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async initialize(nodeId: string): Promise<Result<void>> {
    try {
      await BlackoutNativeModule.initialize(nodeId);
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: mapError(error) };
    }
  }

  async startNetworking(): Promise<Result<void>> {
    try {
      await BlackoutNativeModule.startNetworking();
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: mapError(error) };
    }
  }

  async getPeers(): Promise<any[]> {
    return BlackoutNativeModule.getPeers();
  }

  async discoverPeers(): Promise<void> {
    return BlackoutNativeModule.discoverPeers();
  }

  async stopNetworking(): Promise<Result<void>> {
    try {
      await BlackoutNativeModule.stopNetworking();
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: mapError(error) };
    }
  }

  async sendMessage(message: MessageDto): Promise<Result<DeliveryHandle>> {
    try {
      // Pass the raw JS object over the bridge to be parsed into a WritableMap
      const data = await BlackoutNativeModule.sendMessage(message);
      return { ok: true, data: data as DeliveryHandle };
    } catch (error) {
      return { ok: false, error: mapError(error) };
    }
  }

  subscribe(listener: (event: NativeBridgeEvent) => void): () => void {
    const subscription = eventEmitter.addListener('NativeEvent', (rawEvent: any) => {
      // Parse the JSON string payload emitted from Java
      if (rawEvent.type === 'MESSAGE_RECEIVED' && rawEvent.data) {
        const parsedMessage = JSON.parse(rawEvent.data) as MessageDto;
        listener({
          type: 'NETWORK',
          event: {
            type: 'MESSAGE_RECEIVED',
            message: parsedMessage,
          }
        });
      } else if (rawEvent.type === 'PEER_DISCONNECTED' && rawEvent.peer_id) {
        listener({
          type: 'NETWORK',
          event: {
            type: 'PEER_DISCONNECTED',
            peer_id: rawEvent.peer_id,
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }
}
