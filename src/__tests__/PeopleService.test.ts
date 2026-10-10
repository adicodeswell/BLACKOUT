import { PeopleService } from '../services/PeopleService';
import { NetworkEngine } from '../contracts/network/NetworkEngine';
import { DataEngine } from '../contracts/data/DataEngine';
import { NetworkEvent } from '../contracts/network/NetworkEvents';
import { MessageDto } from '../contracts/network/MessageDto';
import { PeerDto } from '../contracts/network/PeerDto';

describe('PeopleService', () => {
  let mockNetworkEngine: jest.Mocked<NetworkEngine>;
  let mockDataEngine: jest.Mocked<DataEngine>;
  let service: PeopleService;
  let networkListeners: ((event: NetworkEvent) => void)[] = [];

  beforeEach(() => {
    networkListeners = [];
    mockNetworkEngine = {
      start: jest.fn(),
      stop: jest.fn(),
      discoverPeers: jest.fn(),
      getPeers: jest.fn().mockResolvedValue({ ok: true, data: [] }),
      connect: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
      disconnect: jest.fn(),
      send: jest.fn().mockResolvedValue({ ok: true, data: 'handle' }),
      broadcast: jest.fn(),
      getDeliveryStatus: jest.fn(),
      subscribe: jest.fn().mockImplementation((listener) => {
        networkListeners.push(listener);
        return () => {
          networkListeners = networkListeners.filter((l) => l !== listener);
        };
      }),
    } as any;

    mockDataEngine = {
      saveMessage: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
      getMessage: jest.fn(),
      getAllMessages: jest.fn().mockResolvedValue({ ok: true, data: [] }),
      getPendingOutbound: jest.fn().mockResolvedValue({ ok: true, data: [] }),
      markDelivered: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
      markFailed: jest.fn(),
      deleteMessage: jest.fn(),
    } as any;

    service = new PeopleService(mockNetworkEngine, mockDataEngine);
    (service as any)._fallbackNodeId = 'local-node-id';
  });

  test('connectToPeer resolves with canonical ID on success', async () => {
    const connectPromise = service.connectToPeer('mac:address');

    // Simulate CONNECTING event
    networkListeners.forEach((l) =>
      l({
        type: 'PEER_DISCOVERED',
        peer: { peer_id: 'mac:address', connection_state: 'CONNECTING', transport: 'WIFI_DIRECT', last_seen_at: Date.now(), capabilities: [] },
      })
    );

    // Simulate PEER_CONNECTED with canonical ID
    networkListeners.forEach((l) =>
      l({
        type: 'PEER_CONNECTED',
        peer: { peer_id: 'canonical-uuid', connection_state: 'CONNECTED', transport: 'WIFI_DIRECT', last_seen_at: Date.now(), capabilities: [] },
      })
    );

    const result = await connectPromise;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('canonical-uuid');
    }
  });

  test('connectToPeer rejects on timeout', async () => {
    jest.useFakeTimers();
    const connectPromise = service.connectToPeer('mac:address');
    
    jest.advanceTimersByTime(16000);
    
    const result = await connectPromise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('TIMEOUT');
    }
    jest.useRealTimers();
  });

  test('sendDirectMessage fails for unresolved IDs', async () => {
    const res1 = await service.sendDirectMessage('mac:address', 'Hello');
    expect(res1.ok).toBe(false);

    const res2 = await service.sendDirectMessage('TEMP-1234', 'Hello');
    expect(res2.ok).toBe(false);
  });

  test('message delivery states are tracked correctly', async () => {
    const messageListener = jest.fn();
    service.subscribeMessages('canonical-uuid', messageListener);

    // Send a message
    const sendRes = await service.sendDirectMessage('canonical-uuid', 'Hello');
    expect(sendRes.ok).toBe(true);
    
    const msg = (sendRes as any).data as MessageDto;
    expect((msg as any)._local_delivery_state).toBe('SENT');

    // Simulate ACK from receiver
    const ackMsg: MessageDto = {
      protocol_version: 1,
      message_id: 'ack_123',
      origin_device_id: 'canonical-uuid',
      destination_device_id: 'local-node-id',
      message_type: 'ACK',
      created_at: Date.now(),
      ttl: 1,
      hop_count: 0,
      priority: 'NORMAL',
      payload_hash: '',
      payload: { ack_to: msg.message_id },
      signature: '',
    };

    mockDataEngine.getMessage.mockResolvedValueOnce({ ok: true, data: msg });

    networkListeners.forEach((l) => l({ type: 'MESSAGE_RECEIVED', message: ackMsg }));

    // Need to wait a tick for the async ACK handling
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10));

    expect(mockDataEngine.markDelivered).toHaveBeenCalledWith(msg.message_id, expect.any(Number));
    expect(messageListener).toHaveBeenCalledWith(expect.objectContaining({
      message_id: msg.message_id,
      _local_delivery_state: 'DELIVERED',
    }));
  });
});
