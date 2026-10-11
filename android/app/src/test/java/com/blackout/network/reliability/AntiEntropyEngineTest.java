package com.blackout.network.reliability;

import com.blackout.data.RoomDataEngine;
import com.blackout.data.dao.NetworkMessageDao;
import com.blackout.data.entity.NetworkMessageEntity;
import com.blackout.data.repository.MessageRepository;
import com.blackout.network.protocol.MessageHandler;
import com.blackout.network.protocol.MessageType;
import com.blackout.network.protocol.NetworkMessage;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;

import java.util.*;

import com.blackout.data.dao.FakeNetworkMessageDao;

import static org.junit.Assert.*;

public class AntiEntropyEngineTest {

    private AntiEntropyEngine engine;
    private RoomDataEngine roomDataEngine;
    private FakeNetworkMessageDao fakeDao;

    @Before
    public void setup() {
        fakeDao = new FakeNetworkMessageDao();
        MessageRepository repo = new MessageRepository(fakeDao);
        roomDataEngine = new RoomDataEngine(null, repo);
        engine = new AntiEntropyEngine("node-alpha", roomDataEngine);
    }

    @Test
    public void testDynamicTtlAllocation() {
        // Issue 1: Dynamic TTLs based on MessageType
        NetworkMessage reportMsg = new NetworkMessage.Builder()
                .messageId("msg-rep-1")
                .originDeviceId("node-alpha")
                .messageType(MessageType.REPORT)
                .payload("{}")
                .build();
        assertEquals("EmergencyReport should receive dynamic TTL=25", 25, reportMsg.getTtl());

        NetworkMessage directMsg = new NetworkMessage.Builder()
                .messageId("msg-dir-1")
                .originDeviceId("node-alpha")
                .destinationDeviceId("node-beta")
                .messageType(MessageType.DIRECT)
                .payload("{\"text\":\"hi\"}")
                .build();
        assertEquals("DirectMessage should receive dynamic TTL=15", 15, directMsg.getTtl());

        NetworkMessage pingMsg = new NetworkMessage.Builder()
                .messageId("msg-ping-1")
                .originDeviceId("node-alpha")
                .messageType(MessageType.HELLO)
                .payload("{}")
                .build();
        assertEquals("Ping/HELLO should receive dynamic TTL=2", 2, pingMsg.getTtl());

        // Explicit TTL override should still be respected
        NetworkMessage customMsg = new NetworkMessage.Builder()
                .messageId("msg-cust-1")
                .originDeviceId("node-alpha")
                .messageType(MessageType.REPORT)
                .ttl(7)
                .payload("{}")
                .build();
        assertEquals("Explicitly specified TTL should be preserved", 7, customMsg.getTtl());
    }

    @Test
    public void testCreateQueueSummary() throws Exception {
        // Pre-populate with 2 messages
        NetworkMessage msg1 = new NetworkMessage.Builder()
                .messageId("msg-1")
                .originDeviceId("node-alpha")
                .messageType(MessageType.REPORT)
                .payload("{\"hazard\":\"fire\"}")
                .build();
        NetworkMessage msg2 = new NetworkMessage.Builder()
                .messageId("msg-2")
                .originDeviceId("node-alpha")
                .messageType(MessageType.RESOURCE)
                .payload("{\"station\":\"water\"}")
                .build();
        roomDataEngine.saveMessage(msg1);
        roomDataEngine.saveMessage(msg2);

        NetworkMessage summary = engine.createQueueSummary("node-beta");
        assertEquals(MessageType.QUEUE_SUMMARY, summary.getMessageType());
        assertEquals("node-alpha", summary.getOriginDeviceId());
        assertEquals("node-beta", summary.getDestinationDeviceId());

        JSONObject payload = new JSONObject(summary.getPayload());
        assertTrue(payload.has("known_messages"));
        JSONArray known = payload.getJSONArray("known_messages");
        assertEquals(2, known.length());
        assertTrue(known.getString(0).equals("msg-2") || known.getString(1).equals("msg-2"));
    }

    @Test
    public void testGenerateSyncDeltaForNewcomer() throws Exception {
        // Node Alpha has 3 messages: 2 reports and 1 direct message to node-beta
        NetworkMessage rep1 = new NetworkMessage.Builder()
                .messageId("rep-1")
                .originDeviceId("node-alpha")
                .messageType(MessageType.REPORT)
                .payload("{\"title\":\"Fire on Main St\"}")
                .build();
        NetworkMessage rep2 = new NetworkMessage.Builder()
                .messageId("rep-2")
                .originDeviceId("node-alpha")
                .messageType(MessageType.REPORT)
                .payload("{\"title\":\"Bridge collapsed\"}")
                .build();
        NetworkMessage dir1 = new NetworkMessage.Builder()
                .messageId("dir-1")
                .originDeviceId("node-alpha")
                .destinationDeviceId("node-beta")
                .messageType(MessageType.DIRECT)
                .payload("{\"text\":\"Meet at safe zone\"}")
                .build();
        roomDataEngine.saveMessage(rep1);
        roomDataEngine.saveMessage(rep2);
        roomDataEngine.saveMessage(dir1);

        // Node Beta (newcomer) sends QUEUE_SUMMARY that only knows rep-1
        JSONObject summaryPayload = new JSONObject();
        JSONArray known = new JSONArray();
        known.put("rep-1");
        summaryPayload.put("known_messages", known);

        NetworkMessage peerSummary = new NetworkMessage.Builder()
                .messageId("summary-beta-1")
                .originDeviceId("node-beta")
                .destinationDeviceId("node-alpha")
                .messageType(MessageType.QUEUE_SUMMARY)
                .payload(summaryPayload.toString())
                .build();

        List<NetworkMessage> deltas = engine.generateSyncDelta(peerSummary, "node-beta");
        assertEquals("Should identify exactly 2 missing messages for peer", 2, deltas.size());

        Set<String> deltaIds = new HashSet<>();
        for (NetworkMessage m : deltas) {
            deltaIds.add(m.getMessageId());
        }
        assertTrue("rep-2 should be in delta", deltaIds.contains("rep-2"));
        assertTrue("dir-1 should be in delta", deltaIds.contains("dir-1"));
        assertFalse("rep-1 should be excluded as peer already has it", deltaIds.contains("rep-1"));
    }

    @Test
    public void testHandleIncomingSyncBatch() throws Exception {
        List<NetworkMessage> receivedByApp = new ArrayList<>();
        MessageHandler.AppMessageListener listener = new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(String sourcePeerId, NetworkMessage message) {
                receivedByApp.add(message);
            }
            @Override
            public void onPeerDisconnected(String peerId) {}
        };

        // Construct a SYNC batch envelope from peer
        JSONObject batchObj = new JSONObject();
        JSONArray messagesArray = new JSONArray();

        JSONObject m1 = new JSONObject();
        m1.put("message_id", "sync-item-1");
        m1.put("origin_device_id", "node-gamma");
        m1.put("message_type", "REPORT");
        m1.put("payload", "{\"incident\":\"Flood\"}");
        m1.put("created_at", System.currentTimeMillis());
        messagesArray.put(m1);

        JSONObject m2 = new JSONObject();
        m2.put("message_id", "sync-item-2");
        m2.put("origin_device_id", "node-gamma");
        m2.put("message_type", "HAZARD");
        m2.put("payload", "{\"danger\":\"Downed line\"}");
        m2.put("created_at", System.currentTimeMillis());
        messagesArray.put(m2);

        batchObj.put("sync_messages", messagesArray);

        NetworkMessage syncMsg = new NetworkMessage.Builder()
                .messageId("sync-envelope-1")
                .originDeviceId("node-gamma")
                .destinationDeviceId("node-alpha")
                .messageType(MessageType.SYNC)
                .payload(batchObj.toString())
                .build();

        engine.handleIncomingSync(syncMsg, listener, "node-gamma");

        assertEquals("App listener should receive both synchronized messages", 2, receivedByApp.size());
        assertNotNull("sync-item-1 should be persisted in RoomDataEngine", roomDataEngine.getMessageEntity("sync-item-1"));
        assertNotNull("sync-item-2 should be persisted in RoomDataEngine", roomDataEngine.getMessageEntity("sync-item-2"));
        assertEquals("RECEIVED", roomDataEngine.getMessageEntity("sync-item-1").deliveryState);
    }
}
