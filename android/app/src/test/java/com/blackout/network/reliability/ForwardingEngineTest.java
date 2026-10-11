package com.blackout.network.reliability;

import com.blackout.geolocation.OfflineGeoEngine;
import com.blackout.geolocation.model.GeoPoint;
import com.blackout.network.protocol.MessageType;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.transport.ConnectionManager;
import com.blackout.network.transport.OutgoingSendManager;

import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.Assert.*;

public class ForwardingEngineTest {

    private ForwardingEngine engine;
    private MessageDeduplicator dedup;

    @Before
    public void setup() {
        ConnectionManager connManager = new ConnectionManager();
        OutgoingSendManager sendManager = new OutgoingSendManager(connManager);
        dedup = new MessageDeduplicator();
        
        // This test device is "device-B"
        engine = new ForwardingEngine("device-B", sendManager, dedup);
    }

    @Test
    public void testShouldForwardValidMessage() {
        NetworkMessage msg = new NetworkMessage.Builder()
                .messageId("msg-1")
                .originDeviceId("device-A")
                .destinationDeviceId("device-C") // Destined for someone else
                .messageType(MessageType.REPORT)
                .ttl(5)
                .hopCount(1) // Still has hops left
                .payloadHash("hash")
                .payload("{}")
                .build();
                
        assertTrue("Should forward a valid message bound for someone else", engine.shouldForward(msg));
    }
    
    @Test
    public void testShouldNotForwardMessageExceedingTTL() {
        NetworkMessage msg = new NetworkMessage.Builder()
                .messageId("msg-2")
                .originDeviceId("device-A")
                .destinationDeviceId("device-C")
                .messageType(MessageType.REPORT)
                .ttl(5)
                .hopCount(5) // Max hops reached!
                .payloadHash("hash")
                .payload("{}")
                .build();
                
        assertFalse("Should NOT forward message with expired TTL", engine.shouldForward(msg));
    }
    
    @Test
    public void testShouldNotForwardMessageDestinedForSelf() {
        NetworkMessage msg = new NetworkMessage.Builder()
                .messageId("msg-3")
                .originDeviceId("device-A")
                .destinationDeviceId("device-B") // We are device-B!
                .messageType(MessageType.REPORT)
                .ttl(5)
                .hopCount(1)
                .payloadHash("hash")
                .payload("{}")
                .build();
                
        assertFalse("Should NOT forward message meant for us", engine.shouldForward(msg));
    }
    
    @Test
    public void testShouldNotForwardOwnMessage() {
        NetworkMessage msg = new NetworkMessage.Builder()
                .messageId("msg-4")
                .originDeviceId("device-B") // We are device-B!
                .destinationDeviceId("device-C")
                .messageType(MessageType.REPORT)
                .ttl(5)
                .hopCount(1)
                .payloadHash("hash")
                .payload("{}")
                .build();
                
        assertFalse("Should NOT forward a message that originated from us", engine.shouldForward(msg));
    }

    @Test
    public void testForwardMessageRecordsInDeduplicator() {
        NetworkMessage msg = new NetworkMessage.Builder()
                .messageId("msg-dedup-test")
                .originDeviceId("device-A")
                .destinationDeviceId("device-C")
                .messageType(MessageType.DIRECT)
                .ttl(3)
                .hopCount(0)
                .payloadHash("hash")
                .payload("{\"text\":\"hello\"}")
                .build();

        assertFalse(dedup.isDuplicate("msg-dedup-test"));
        engine.forwardMessage(msg, "device-A");
        assertTrue("Forwarding should record message in deduplicator", dedup.isDuplicate("msg-dedup-test"));
    }

    @Test
    public void testRelayAckBackToOrigin() {
        // Device C generates an ACK destined for Device A, passing through Device B
        NetworkMessage ackMsg = new NetworkMessage.Builder()
                .messageId("ack-msg-123")
                .originDeviceId("device-C")
                .destinationDeviceId("device-A") // Bound for device-A, not device-B
                .messageType(MessageType.ACK)
                .ttl(3)
                .hopCount(0)
                .payload("{\"ack_to\":\"msg-orig-123\"}")
                .payloadHash("hash")
                .build();

        assertTrue("Device B should relay ACK destined for Device A", engine.shouldForward(ackMsg));
    }

    @Test
    public void testDropWhenTtlEqualsHopCount() {
        NetworkMessage msg = new NetworkMessage.Builder()
                .messageId("msg-ttl-exact")
                .originDeviceId("device-A")
                .destinationDeviceId("device-C")
                .messageType(MessageType.DIRECT)
                .ttl(2)
                .hopCount(2) // Exactly reached TTL limit
                .payloadHash("hash")
                .payload("{\"text\":\"hello\"}")
                .build();

        assertFalse("Should drop message when hopCount == ttl", engine.shouldForward(msg));
    }

    @Test
    public void testLoopReplaySuppressedByDeduplication() {
        NetworkMessage msg = new NetworkMessage.Builder()
                .messageId("msg-loop-1")
                .originDeviceId("device-A")
                .destinationDeviceId("device-C")
                .messageType(MessageType.DIRECT)
                .ttl(5)
                .hopCount(1)
                .payloadHash("hash")
                .payload("{\"text\":\"loop test\"}")
                .build();

        // First arrival
        assertTrue("First arrival should be allowed to forward", engine.shouldForward(msg));
        engine.forwardMessage(msg, "device-A");

        // Loop arrival: message bounces back to B
        assertTrue("Deduplicator should have recorded msg-loop-1", dedup.isDuplicate("msg-loop-1"));
    }

    private static class TestOutgoingSendManager extends OutgoingSendManager {
        List<String> directSentPeers = new ArrayList<>();
        List<NetworkMessage> broadcastMessages = new ArrayList<>();
        List<String> activeNeighbors = new ArrayList<>();

        public TestOutgoingSendManager(ConnectionManager cm) {
            super(cm);
        }

        @Override
        public boolean sendDirect(NetworkMessage msg, String peerId) {
            if (activeNeighbors.contains(peerId)) {
                directSentPeers.add(peerId);
                return true;
            }
            return false;
        }

        @Override
        public boolean broadcastExcept(NetworkMessage msg, String excludedPeerId) {
            broadcastMessages.add(msg);
            return true;
        }

        @Override
        public List<String> getActivePeerIds() {
            return activeNeighbors;
        }
    }

    private OfflineGeoEngine createTestGeoEngine(double selfLat, double selfLon) {
        OfflineGeoEngine.LocationProvider provider = new OfflineGeoEngine.LocationProvider() {
            @Override
            public OfflineGeoEngine.LocationSample getCurrentLocation() {
                return new OfflineGeoEngine.LocationSample(selfLat, selfLon, 5.0, System.currentTimeMillis());
            }
            @Override
            public Runnable observe(OfflineGeoEngine.LocationListener listener) { return () -> {}; }
        };
        return new OfflineGeoEngine(provider, new com.blackout.geolocation.LocationValidator(), new com.blackout.geolocation.OfflineMapManager(java.util.Collections.emptyList()));
    }

    @Test
    public void testGpsrGreedyForwardingPicksCloserNeighbor() {
        // Self is in San Francisco Civic Center: (37.7749, -122.4194)
        OfflineGeoEngine geo = createTestGeoEngine(37.7749, -122.4194);
        
        // Destination: North Beach (37.8000, -122.4050)
        geo.updatePeerLocation("peer-dest", 37.8000, -122.4050);
        
        // Neighbor 1: Nob Hill (37.7920, -122.4120) -> strictly CLOSER to destination than self
        geo.updatePeerLocation("peer-closer", 37.7920, -122.4120);

        // Neighbor 2: Mission District (37.7550, -122.4200) -> strictly FARTHER from destination than self
        geo.updatePeerLocation("peer-farther", 37.7550, -122.4200);

        TestOutgoingSendManager testSendManager = new TestOutgoingSendManager(new ConnectionManager());
        testSendManager.activeNeighbors.addAll(Arrays.asList("peer-closer", "peer-farther"));

        ForwardingEngine gpsrEngine = new ForwardingEngine("device-self", testSendManager, new MessageDeduplicator(), geo);

        NetworkMessage directMsg = new NetworkMessage.Builder()
                .messageId("msg-gpsr-1")
                .originDeviceId("device-sender")
                .destinationDeviceId("peer-dest")
                .messageType(MessageType.DIRECT)
                .ttl(15)
                .hopCount(1)
                .payloadHash("hash")
                .payload("{\"text\":\"emergency direct message\"}")
                .build();

        gpsrEngine.forwardMessage(directMsg, "device-sender");

        // Verification 1: Routed to peer-closer
        assertTrue("Must forward to geographically closer neighbor", testSendManager.directSentPeers.contains("peer-closer"));

        // Verification 2: NEVER routed to peer-farther
        assertFalse("Must NOT forward to farther neighbor", testSendManager.directSentPeers.contains("peer-farther"));

        // Verification 3: Broadcast storm prevented (no 360-degree broadcast)
        assertTrue("Must NOT blind broadcast DIRECT messages", testSendManager.broadcastMessages.isEmpty());
    }

    @Test
    public void testGpsrSuppressesBlindBroadcastInLocalMinimum() {
        // Self is closer to destination than all surrounding neighbors (local minimum / void)
        OfflineGeoEngine geo = createTestGeoEngine(37.7749, -122.4194);
        geo.updatePeerLocation("peer-dest", 37.7800, -122.4150);

        // Both neighbors are behind us (farther away from destination)
        geo.updatePeerLocation("peer-back-1", 37.7500, -122.4300);
        geo.updatePeerLocation("peer-back-2", 37.7400, -122.4400);

        TestOutgoingSendManager testSendManager = new TestOutgoingSendManager(new ConnectionManager());
        testSendManager.activeNeighbors.addAll(Arrays.asList("peer-back-1", "peer-back-2"));

        ForwardingEngine gpsrEngine = new ForwardingEngine("device-self", testSendManager, new MessageDeduplicator(), geo);

        NetworkMessage directMsg = new NetworkMessage.Builder()
                .messageId("msg-gpsr-void")
                .originDeviceId("device-sender")
                .destinationDeviceId("peer-dest")
                .messageType(MessageType.DIRECT)
                .ttl(15)
                .hopCount(1)
                .payloadHash("hash")
                .payload("{\"text\":\"hello void\"}")
                .build();

        gpsrEngine.forwardMessage(directMsg, "device-sender");

        // Blind broadcast storm is completely suppressed!
        assertTrue("Must not send direct to farther neighbors in void", testSendManager.directSentPeers.isEmpty());
        assertTrue("Must not blind broadcast in void to prevent network storm", testSendManager.broadcastMessages.isEmpty());
    }

    @Test
    public void testNonDirectMessagesContinueToBroadcastForDisasterCoverage() {
        OfflineGeoEngine geo = createTestGeoEngine(37.7749, -122.4194);
        TestOutgoingSendManager testSendManager = new TestOutgoingSendManager(new ConnectionManager());
        testSendManager.activeNeighbors.addAll(Arrays.asList("peer-1", "peer-2"));

        ForwardingEngine gpsrEngine = new ForwardingEngine("device-self", testSendManager, new MessageDeduplicator(), geo);

        NetworkMessage reportMsg = new NetworkMessage.Builder()
                .messageId("msg-report-broadcast")
                .originDeviceId("device-sender")
                .destinationDeviceId(null) // Broadcast to all
                .messageType(MessageType.REPORT)
                .ttl(25)
                .hopCount(1)
                .payloadHash("hash")
                .payload("{\"category\":\"FIRE\",\"severity\":\"CRITICAL\"}")
                .build();

        gpsrEngine.forwardMessage(reportMsg, "device-sender");

        // Emergency REPORT messages must saturate the network via broadcast
        assertEquals(1, testSendManager.broadcastMessages.size());
        assertEquals("msg-report-broadcast", testSendManager.broadcastMessages.get(0).getMessageId());
    }

    @Test
    public void testOfflineGeoEngineFilterCloserNeighbors() {
        OfflineGeoEngine geo = createTestGeoEngine(37.7749, -122.4194);
        geo.updatePeerLocation("dest", 37.8000, -122.4000);
        geo.updatePeerLocation("close-1", 37.7900, -122.4100);
        geo.updatePeerLocation("far-1", 37.7000, -122.5000);

        List<String> closer = geo.filterCloserNeighbors("dest", Arrays.asList("close-1", "far-1"));
        assertEquals(1, closer.size());
        assertEquals("close-1", closer.get(0));

        Map<String, Double> distances = geo.compareNeighborDistances("dest", Arrays.asList("close-1", "far-1"));
        assertTrue(distances.get("close-1") < distances.get("far-1"));
    }
}

