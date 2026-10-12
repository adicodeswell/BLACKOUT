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
      updateDeliveryState: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
      markDelivered: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
      markFailed: jest.fn(),
      deleteMessage: jest.fn(),
      saveContact: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
      getContact: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
      getAllContacts: jest.fn().mockResolvedValue({ ok: true, data: [] }),
      searchContacts: jest.fn().mockResolvedValue({ ok: true, data: [] }),
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
    try {
      const connectPromise = service.connectToPeer('mac:address');
      
      jest.advanceTimersByTime(36000);
      
      const result = await connectPromise;
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('TIMEOUT');
      }
    } finally {
      jest.useRealTimers();
    }
  });

  test('sendDirectMessage sends or queues messages for discovered or pending transport IDs', async () => {
    const res1 = await service.sendDirectMessage('mac:address', 'Hello');
    expect(res1.ok).toBe(true);

    // If network engine fails to send, state remains QUEUED
    mockNetworkEngine.send.mockResolvedValueOnce({ ok: false, error: { code: 'UNAVAILABLE', message: 'offline', retryable: true, module: 'NETWORK' } });
    const res2 = await service.sendDirectMessage('TEMP-1234', 'Hello');
    expect(res2.ok).toBe(true);
    if (res2.ok) {
      expect((res2.data as any)._local_delivery_state).toBe('QUEUED');
    }
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

  test('offline message drafting queues message in DataEngine without failing', async () => {
    mockNetworkEngine.send.mockResolvedValueOnce({
      ok: true,
      data: { message_id: 'msg-offline', accepted_at: Date.now(), status: 'QUEUED' },
    });

    const res = await service.sendDirectMessage('peer-offline-uuid', 'Queued message while offline');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect((res.data as any)._local_delivery_state).toBe('QUEUED');
    }

    expect(mockDataEngine.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        destination_device_id: 'peer-offline-uuid',
        _local_delivery_state: 'QUEUED',
      })
    );
  });

  test('flushQueue opportunistically transmits queued outbound messages upon reconnect', async () => {
    const queuedMessage: MessageDto = {
      protocol_version: 1,
      message_id: 'msg-pending-1',
      origin_device_id: 'local-node-id',
      destination_device_id: 'peer-dest-uuid',
      message_type: 'DIRECT',
      created_at: Date.now() - 5000,
      ttl: 3,
      hop_count: 0,
      priority: 'NORMAL',
      payload_hash: 'hash',
      payload: { text: 'Carried packet' },
      signature: '',
      _local_delivery_state: 'QUEUED',
    };

    mockDataEngine.getPendingOutbound.mockResolvedValueOnce({
      ok: true,
      data: [queuedMessage],
    });
    mockNetworkEngine.send.mockResolvedValueOnce({
      ok: true,
      data: { message_id: 'msg-pending-1', accepted_at: Date.now(), status: 'SENT' },
    });

    await service.flushQueue();

    expect(mockNetworkEngine.send).toHaveBeenCalledWith(queuedMessage);
    expect(mockDataEngine.updateDeliveryState).toHaveBeenCalledWith('msg-pending-1', 'SENT');
  });

  test('MESSAGE_DELIVERY_UPDATED event updates state to DELIVERED and marks delivered in DataEngine', async () => {
    const messageListener = jest.fn();
    service.subscribeMessages('canonical-uuid', messageListener);

    const sendRes = await service.sendDirectMessage('canonical-uuid', 'Hello Status Test');
    expect(sendRes.ok).toBe(true);
    const msg = (sendRes as any).data as MessageDto;

    networkListeners.forEach((l) =>
      l({
        type: 'MESSAGE_DELIVERY_UPDATED',
        status: {
          message_id: msg.message_id,
          state: 'DELIVERED',
          updated_at: Date.now(),
          attempts: 1,
        },
      })
    );

    expect(mockDataEngine.markDelivered).toHaveBeenCalledWith(msg.message_id, expect.any(Number));
    expect(messageListener).toHaveBeenCalledWith(
      expect.objectContaining({
        message_id: msg.message_id,
        _local_delivery_state: 'DELIVERED',
      })
    );
  });

  test('auto-persists contact on PEER_CONNECTED event', async () => {
    networkListeners.forEach((l) =>
      l({
        type: 'PEER_CONNECTED',
        peer: {
          peer_id: 'peer-uuid-5678',
          name: 'Alice',
          transport: 'WIFI_DIRECT',
          connection_state: 'CONNECTED',
          last_seen_at: Date.now(),
          capabilities: [],
        },
      })
    );

    expect(mockDataEngine.saveContact).toHaveBeenCalledWith(
      expect.objectContaining({
        peer_id: 'peer-uuid-5678',
        name: 'Alice',
        transport: 'WIFI_DIRECT',
      })
    );
  });

  test('auto-persists contact on incoming direct message', async () => {
    networkListeners.forEach((l) =>
      l({
        type: 'MESSAGE_RECEIVED',
        message: {
          protocol_version: 1,
          message_id: 'msg-incoming-99',
          origin_device_id: 'peer-uuid-9999',
          destination_device_id: 'local-node-id',
          message_type: 'DIRECT',
          created_at: Date.now(),
          ttl: 3,
          hop_count: 0,
          priority: 'NORMAL',
          payload_hash: '',
          payload: { text: 'Hello from 9999' },
          signature: '',
        },
      })
    );

    expect(mockDataEngine.saveContact).toHaveBeenCalledWith(
      expect.objectContaining({
        peer_id: 'peer-uuid-9999',
        name: 'User #9999',
      })
    );
  });

  test('getAllContacts and searchContacts delegate to DataEngine', async () => {
    const mockContacts = [
      { peer_id: 'peer-1', name: 'Bob', transport: 'BLE' as const, last_seen_at: Date.now() },
      { peer_id: 'peer-2', name: 'Alice', transport: 'WIFI_DIRECT' as const, last_seen_at: Date.now() },
    ];
    (mockDataEngine.getAllContacts as jest.Mock).mockResolvedValueOnce({ ok: true, data: mockContacts });
    (mockDataEngine as any).searchContacts.mockResolvedValueOnce({ ok: true, data: [mockContacts[1]] });

    const all = await service.getAllContacts();
    expect(all.ok).toBe(true);
    if (all.ok) {
      expect(all.data).toHaveLength(2);
    }

    const search = await service.searchContacts('Ali');
    expect(search.ok).toBe(true);
    if (search.ok) {
      expect(search.data).toHaveLength(1);
      expect(search.data[0].name).toBe('Alice');
    }
  });

  test('sendDirectMessage resolves canonical UUID when peer was discovered by MAC address', async () => {
    // 1. Peer discovered via Wi-Fi Direct with MAC address
    networkListeners.forEach((l) =>
      l({
        type: 'PEER_DISCOVERED',
        peer: {
          peer_id: '4A:5E:3B:11:22:33',
          transport_address: '4A:5E:3B:11:22:33',
          connection_state: 'DISCOVERED',
          transport: 'WIFI_DIRECT',
          last_seen_at: Date.now(),
          capabilities: [],
        },
      })
    );

    // 2. Handshake completes and emits PEER_CONNECTED with canonical UUID and transport_address
    networkListeners.forEach((l) =>
      l({
        type: 'PEER_CONNECTED',
        peer_id: 'canonical-uuid-1234',
        transport_address: '4A:5E:3B:11:22:33',
        peer: {
          peer_id: 'canonical-uuid-1234',
          transport_address: '4A:5E:3B:11:22:33',
          connection_state: 'CONNECTED',
          transport: 'WIFI_DIRECT',
          last_seen_at: Date.now(),
          capabilities: [],
        },
      } as any)
    );

    // 3. User sends a message to the discovered MAC address
    const sendRes = await service.sendDirectMessage('4A:5E:3B:11:22:33', 'Hello via resolved UUID');
    expect(sendRes.ok).toBe(true);

    // 4. Verify message sent to network engine has destination resolved to canonical UUID
    expect(mockNetworkEngine.send).toHaveBeenCalledWith(
      expect.objectContaining({
        destination_device_id: 'canonical-uuid-1234',
        payload: { text: 'Hello via resolved UUID' },
      })
    );
  });

  test('PEER_CONNECTED migrates existing conversation drafted under MAC address to canonical UUID', async () => {
    // 1. User drafts/sends a message while peer was only known by MAC address
    await service.sendDirectMessage('4A:5E:3B:11:22:33', 'Drafted before handshake');
    expect(service.getConversation('4A:5E:3B:11:22:33')).toHaveLength(1);

    // 2. PEER_CONNECTED arrives with canonical UUID and transport_address
    networkListeners.forEach((l) =>
      l({
        type: 'PEER_CONNECTED',
        peer_id: 'canonical-uuid-5678',
        transport_address: '4A:5E:3B:11:22:33',
        peer: {
          peer_id: 'canonical-uuid-5678',
          transport_address: '4A:5E:3B:11:22:33',
          connection_state: 'CONNECTED',
          transport: 'WIFI_DIRECT',
          last_seen_at: Date.now(),
          capabilities: [],
        },
      } as any)
    );

    // 3. Verify conversation was migrated to canonical UUID and old MAC conversation deleted
    expect(service.getConversation('4A:5E:3B:11:22:33')).toHaveLength(0);
    const canonicalConvo = service.getConversation('canonical-uuid-5678');
    expect(canonicalConvo).toHaveLength(1);
    expect(canonicalConvo[0].destination_device_id).toBe('canonical-uuid-5678');
  });
});
