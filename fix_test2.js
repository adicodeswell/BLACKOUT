const fs = require('fs');
const file = 'tests/integration/MeshIntegration.test.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the buggy test code
const oldTest = `  it("should not ACK if incoming message save fails", async () => {
    // Mock saveMessage to fail
    const originalSave = dataA.saveMessage;
    dataA.saveMessage = async () => ({ ok: false, error: { code: 'FAIL', message: 'Fail', retryable: false, module: 'DATA' } });
    
    // Simulate incoming message natively via receiveRaw
    netA.receiveRaw({
      protocol_version: 1,
      message_id: 'msg_fail_1',
      message_type: 'DIRECT',
      origin_device_id: netB.localNodeId,
      destination_device_id: netA.localNodeId,
      payload: { text: 'test' },
      created_at: Date.now(),
      ttl: 3,
      hop_count: 0,
      priority: "NORMAL",
      payload_hash: "hash",
      signature: "sig"
    });
    
    await delay(50);
    
    // Node A should NOT send an ACK (we verify that netA didn't send one)
    const sentAcks = netA.sentMessages.filter(m => m.message_type === 'ACK' && m.message_id === 'msg_fail_1');
    expect(sentAcks.length).toBe(0);
    
    // Restore
    dataA.saveMessage = originalSave;
  });`;

const newTest = `  it("should not ACK if incoming message save fails", async () => {
    // Mock saveMessage to fail
    const originalSave = dataA.saveMessage;
    dataA.saveMessage = async () => ({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Fail', retryable: false, module: 'DATA' } as any });
    
    const sendSpy = jest.spyOn(netA, 'send');
    
    // Simulate incoming message natively via receiveRaw
    netA.receiveRaw({
      protocol_version: 1,
      message_id: 'msg_fail_1',
      message_type: 'DIRECT',
      origin_device_id: netB.localNodeId,
      destination_device_id: netA.localNodeId,
      payload: { text: 'test' },
      created_at: Date.now(),
      ttl: 3,
      hop_count: 0,
      priority: "NORMAL",
      payload_hash: "hash",
      signature: "sig"
    });
    
    await delay(50);
    
    // Node A should NOT send an ACK
    const sentAcks = sendSpy.mock.calls.filter(call => call[0].message_type === 'ACK');
    expect(sentAcks.length).toBe(0);
    
    // Restore
    sendSpy.mockRestore();
    dataA.saveMessage = originalSave;
  });`;

content = content.replace(oldTest, newTest);
fs.writeFileSync(file, content, 'utf8');
