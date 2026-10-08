import { NativeModules, NativeEventEmitter } from 'react-native';
import { NativeBridgeAdapter } from '../../src/adapters/native/NativeBridgeAdapter';
import type { MessageDto } from '../../src/contracts/network/MessageDto';

jest.mock('react-native', () => {
  global.__rnListeners = {};
  return {
    NativeModules: {
      BlackoutNativeModule: {
        sendMessage: jest.fn().mockResolvedValue({ message_id: 'mock-1', accepted_at: Date.now() }),
      },
    },
    Platform: { OS: 'android' },
    NativeEventEmitter: class {
      addListener(event: string, callback: Function) {
        if (!global.__rnListeners[event]) global.__rnListeners[event] = [];
        global.__rnListeners[event].push(callback);
        return { remove: () => { global.__rnListeners[event] = global.__rnListeners[event].filter(cb => cb !== callback); } };
      }
      emit(event: string, ...args: any[]) {
        if (global.__rnListeners[event]) {
          global.__rnListeners[event].forEach(cb => cb(...args));
        }
      }
    },
  };
});

describe('NativeBridgeAdapter Event Simulation', () => {
  let adapter: NativeBridgeAdapter;
  let eventEmitter: any;

  beforeEach(() => {
    global.__rnListeners = {};
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
      expect(event.event?.type).toBe('MESSAGE_RECEIVED');
      if (event.event?.type === 'MESSAGE_RECEIVED') {
        expect(event.event.message.message_id).toBe("test-id");
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
      expect(event.event?.type).toBe('PEER_DISCONNECTED');
      if (event.event?.type === 'PEER_DISCONNECTED') {
        expect(event.event.peer_id).toBe("dropped_peer");
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

    // Simulate Native event
    eventEmitter.emit('NativeEvent', {
      type: 'PEER_CONNECTED',
      peer_id: "new_peer"
    });

    eventEmitter.emit('NativeEvent', {
      type: 'PEER_DISCOVERED',
      peer_id: "new_peer_2"
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, {
      type: 'NETWORK',
      event: { type: 'PEER_CONNECTED', peer_id: 'new_peer' }
    });
    expect(listener).toHaveBeenNthCalledWith(2, {
      type: 'NETWORK',
      event: { type: 'PEER_DISCOVERED', peer_id: 'new_peer_2' }
    });
  });
});
