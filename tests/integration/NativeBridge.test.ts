declare var global: any;
import { NativeModules, NativeEventEmitter } from 'react-native';
import { NativeBridgeAdapter } from '../../src/adapters/native/NativeBridgeAdapter';
import type { MessageDto } from '../../src/contracts/network/MessageDto';

const mockRnListeners: Record<string, Function[]> = {};

jest.mock('react-native', () => {
  return {
    NativeModules: {
      BlackoutNativeModule: {
        sendMessage: jest.fn().mockResolvedValue({ message_id: 'mock-1', accepted_at: Date.now() }),
      },
    },
    Platform: { OS: 'android' },
    NativeEventEmitter: class {
      addListener(event: string, callback: Function) {
        if (!mockRnListeners[event]) mockRnListeners[event] = [];
        mockRnListeners[event].push(callback);
        return { remove: () => { mockRnListeners[event] = mockRnListeners[event].filter((cb: any) => cb !== callback); } };
      }
      emit(event: string, ...args: any[]) {
        if (mockRnListeners[event]) {
          mockRnListeners[event].forEach((cb: any) => cb(...args));
        }
      }
    },
  };
});

describe('NativeBridgeAdapter Event Simulation', () => {
  let adapter: NativeBridgeAdapter;
  let eventEmitter: any;

  beforeEach(() => {
    Object.keys(mockRnListeners).forEach(k => delete mockRnListeners[k]);
    adapter = new NativeBridgeAdapter();
    // Re-instantiate NativeEventEmitter to clear listeners
    eventEmitter = new NativeEventEmitter(NativeModules.BlackoutNativeModule as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should parse and emit MESSAGE_RECEIVED events', (done) => {
    const mockMessage: MessageDto = {
      protocol_version: 1,
      message_id: "test-id",
      origin_device_id: "node_test",
      message_type: "DIRECT",
      created_at: Date.now(),
      ttl: 3,
      hop_count: 0,
      priority: "NORMAL",
      payload_hash: "hash",
      payload: { text: "Hello Native" },
      signature: "sig",
    };

    adapter.subscribe((event) => {
      expect(event.type).toBe('NETWORK');
      expect((event as any).event?.type).toBe('MESSAGE_RECEIVED');
      if ((event as any).event?.type === 'MESSAGE_RECEIVED') {
        expect((event as any).event.message.message_id).toBe("test-id");
      }
      done();
    });

    // Simulate native layer emitting a JSON payload
    eventEmitter.emit('NativeEvent', {
      type: 'MESSAGE_RECEIVED',
      data: JSON.stringify(mockMessage)
    });
  });

  it('should handle PEER_DISCONNECTED events correctly', (done) => {
    adapter.subscribe((event) => {
      expect(event.type).toBe('NETWORK');
      expect((event as any).event?.type).toBe('PEER_DISCONNECTED');
      if ((event as any).event?.type === 'PEER_DISCONNECTED') {
        expect((event as any).event.peer_id).toBe("dropped_peer");
      }
      done();
    });

    eventEmitter.emit('NativeEvent', {
      type: 'PEER_DISCONNECTED',
      peer_id: "dropped_peer"
    });
  });

  it('should parse and emit PEER_CONNECTED and PEER_DISCOVERED events', () => {
    const listener = jest.fn();
    adapter.subscribe(listener);

    const mockPeer = { peer_id: 'new_peer', transport: 'WIFI_DIRECT', connection_state: 'CONNECTED', last_seen_at: 0, capabilities: [] };
    const mockPeer2 = { peer_id: 'new_peer_2', transport: 'WIFI_DIRECT', connection_state: 'DISCOVERED', last_seen_at: 0, capabilities: [] };

    // Simulate Native event
    eventEmitter.emit('NativeEvent', {
      type: 'PEER_CONNECTED',
      peer: mockPeer
    });

    eventEmitter.emit('NativeEvent', {
      type: 'PEER_DISCOVERED',
      peer: mockPeer2
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, {
      type: 'NETWORK',
      event: { type: 'PEER_CONNECTED', peer: mockPeer }
    });
    expect(listener).toHaveBeenNthCalledWith(2, {
      type: 'NETWORK',
      event: { type: 'PEER_DISCOVERED', peer: mockPeer2 }
    });
  });
});
