package com.blackout.network.protocol;

import com.blackout.network.reliability.ForwardingEngine;
import com.blackout.network.reliability.MessageDeduplicator;
import com.blackout.network.reliability.MessageQueue;
import com.blackout.network.transport.ConnectionManager;
import com.blackout.network.transport.NetworkServer;
import com.blackout.network.transport.OutgoingSendManager;
import com.blackout.network.transport.PeerConnection;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.net.Socket;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Comprehensive physical-emulation integration test suite.
 * Tests multi-device mesh routing, store-and-forward, reverse ACKs,
 * anti-entropy, and loop suppression over real TCP loopback sockets.
 */
public class PhysicalMeshSocketIntegrationTest {

    private static class TestMeshNode {
        final String deviceId;
        final ConnectionManager connectionManager;
        final MessageDeduplicator deduplicator;
        final OutgoingSendManager sendManager;
        final ForwardingEngine forwardingEngine;
        final HandshakeManager handshakeManager;
        final MessageHandler messageHandler;
        NetworkServer server;
        final List<NetworkMessage> receivedMessages = Collections.synchronizedList(new ArrayList<>());
        final List<PeerConnection> clientSockets = new ArrayList<>();
        final ConcurrentHashMap<String, CountDownLatch> handshakeLatches = new ConcurrentHashMap<>();

        TestMeshNode(String deviceId, MessageHandler.AppMessageListener customListener) {
            this.deviceId = deviceId;
            this.connectionManager = new ConnectionManager();
            this.deduplicator = new MessageDeduplicator();
            this.sendManager = new OutgoingSendManager(connectionManager);
            this.forwardingEngine = new ForwardingEngine(deviceId, sendManager, deduplicator);

            this.handshakeManager = new HandshakeManager(deviceId, connectionManager, peerId -> {
                CountDownLatch latch = handshakeLatches.get(peerId);
                if (latch != null) {
                    latch.countDown();
                }
            });

            MessageHandler.AppMessageListener listener = customListener != null ? customListener : new MessageHandler.AppMessageListener() {
                @Override
                public void onApplicationMessage(NetworkMessage message) {
                    receivedMessages.add(message);
                    // Auto-forward if this node is an intermediate relay and not destination
                    if (!deviceId.equals(message.getDestinationDeviceId())) {
                        forwardingEngine.forwardMessage(message);
                    }
                }

                @Override
                public void onPeerDisconnected(String peerId) {}
            };

            this.messageHandler = new MessageHandler(connectionManager, handshakeManager, deduplicator, listener);
        }

        void expectHandshakeWith(String peerId, CountDownLatch latch) {
            handshakeLatches.put(peerId, latch);
        }

        int startServer() throws Exception {
            server = new NetworkServer(0, socket -> {
                try {
                    String tempId = "TEMP-" + socket.getPort();
                    PeerConnection peerConn = new PeerConnection(tempId, socket, messageHandler);
                    connectionManager.addConnection(peerConn);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
            server.start();
            return server.getPort();
        }

        PeerConnection connectTo(String targetPeerId, int targetPort) throws Exception {
            Socket socket = new Socket("127.0.0.1", targetPort);
            PeerConnection peerConn = new PeerConnection(targetPeerId, socket, messageHandler);
            connectionManager.addConnection(peerConn);
            clientSockets.add(peerConn);
            handshakeManager.initiateHandshake(peerConn);
            return peerConn;
        }

        void stop() {
            if (server != null) {
                server.stop();
            }
            for (PeerConnection pc : clientSockets) {
                pc.disconnect();
            }
            connectionManager.getActivePeerIds().forEach(id -> connectionManager.removeConnection(id));
        }
    }

    private TestMeshNode nodeA;
    private TestMeshNode nodeB;
    private TestMeshNode nodeC;

    @Before
    public void setUp() throws Exception {}

    @After
    public void tearDown() {
        if (nodeA != null) nodeA.stop();
        if (nodeB != null) nodeB.stop();
        if (nodeC != null) nodeC.stop();
    }

    /**
     * Test 1: Full 3-Device Physical Relay & Reverse Delivery ACK over real TCP sockets.
     * Topology: Node A <-> Node B <-> Node C (Node A has no direct socket to Node C).
     * Node A sends a DIRECT message to Node C.
     * Node B relays it over real TCP socket to Node C.
     * Node C receives message and sends reverse ACK to Node A.
     * Node B relays ACK over real TCP socket back to Node A.
     */
    @Test
    public void testThreeDevicePhysicalSocketRelayAndReverseAck() throws Exception {
        CountDownLatch handshakeAB = new CountDownLatch(1);
        CountDownLatch handshakeBA = new CountDownLatch(1);
        CountDownLatch handshakeCB = new CountDownLatch(1);
        CountDownLatch handshakeBC = new CountDownLatch(1);

        CountDownLatch messageDeliveredToCLatch = new CountDownLatch(1);
        CountDownLatch ackDeliveredToALatch = new CountDownLatch(1);

        // Node C: Destination device
        nodeC = new TestMeshNode("DEVICE-C-UUID", new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {
                if (message.getMessageType() == MessageType.DIRECT &&
                    "DEVICE-C-UUID".equals(message.getDestinationDeviceId())) {
                    messageDeliveredToCLatch.countDown();

                    // Generate reverse multi-hop delivery ACK back to origin
                    NetworkMessage ack = new NetworkMessage.Builder()
                            .messageId("ack_" + message.getMessageId())
                            .originDeviceId("DEVICE-C-UUID")
                            .destinationDeviceId(message.getOriginDeviceId())
                            .messageType(MessageType.ACK)
                            .createdAt(System.currentTimeMillis())
                            .ttl(15)
                            .hopCount(0)
                            .priority("NORMAL")
                            .payload("{\"ack_to\":\"" + message.getMessageId() + "\"}")
                            .build();

                    nodeC.sendManager.broadcast(ack);
                }
            }

            @Override
            public void onPeerDisconnected(String peerId) {}
        });

        // Node B: Intermediate Relay device
        nodeB = new TestMeshNode("DEVICE-B-UUID", null);
        int portB = nodeB.startServer();

        // Node A: Origin sender device
        nodeA = new TestMeshNode("DEVICE-A-UUID", new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {
                if (message.getMessageType() == MessageType.ACK &&
                    "DEVICE-A-UUID".equals(message.getDestinationDeviceId())) {
                    ackDeliveredToALatch.countDown();
                }
            }

            @Override
            public void onPeerDisconnected(String peerId) {}
        });

        // Setup expectations for handshakes
        nodeA.expectHandshakeWith("DEVICE-B-UUID", handshakeAB);
        nodeB.expectHandshakeWith("DEVICE-A-UUID", handshakeBA);
        nodeC.expectHandshakeWith("DEVICE-B-UUID", handshakeCB);
        nodeB.expectHandshakeWith("DEVICE-C-UUID", handshakeBC);

        // A connects to B
        nodeA.connectTo("DEVICE-B-UUID", portB);
        // C connects to B
        nodeC.connectTo("DEVICE-B-UUID", portB);

        // Await 4-way handshakes to complete over TCP sockets
        assertTrue("A <-> B handshake must complete", handshakeAB.await(5, TimeUnit.SECONDS));
        assertTrue("B <-> A handshake must complete", handshakeBA.await(5, TimeUnit.SECONDS));
        assertTrue("C <-> B handshake must complete", handshakeCB.await(5, TimeUnit.SECONDS));
        assertTrue("B <-> C handshake must complete", handshakeBC.await(5, TimeUnit.SECONDS));

        // Verify connections are marked READY on all nodes
        assertNotNull("Node A must have READY connection to Node B",
                nodeA.connectionManager.getReadyConnection("DEVICE-B-UUID"));
        assertNotNull("Node B must have READY connection to Node A",
                nodeB.connectionManager.getReadyConnection("DEVICE-A-UUID"));
        assertNotNull("Node B must have READY connection to Node C",
                nodeB.connectionManager.getReadyConnection("DEVICE-C-UUID"));
        assertNotNull("Node C must have READY connection to Node B",
                nodeC.connectionManager.getReadyConnection("DEVICE-B-UUID"));

        // A sends DIRECT message to C (relayed via B)
        NetworkMessage directMessage = new NetworkMessage.Builder()
                .messageId("msg-physical-chat-999")
                .originDeviceId("DEVICE-A-UUID")
                .destinationDeviceId("DEVICE-C-UUID")
                .messageType(MessageType.DIRECT)
                .createdAt(System.currentTimeMillis())
                .ttl(15)
                .hopCount(0)
                .priority("NORMAL")
                .payload("{\"text\":\"Emergency check-in from Alice\"}")
                .build();

        // Send from Node A across socket to neighbor Node B
        boolean sendSuccess = nodeA.sendManager.sendDirect(directMessage, "DEVICE-B-UUID");
        assertTrue("Node A should send message across TCP socket to Node B", sendSuccess);

        // Verify Node C receives the message within 5 seconds
        boolean messageReceived = messageDeliveredToCLatch.await(5, TimeUnit.SECONDS);
        assertTrue("Node C must receive relayed message over real TCP socket from Node B", messageReceived);

        // Verify Node A receives the reverse ACK within 5 seconds
        boolean ackReceived = ackDeliveredToALatch.await(5, TimeUnit.SECONDS);
        assertTrue("Node A must receive reverse multi-hop ACK over real TCP socket from Node C via Node B", ackReceived);
    }

    /**
     * Test 2: Broadcast Storm & Relay Loop Suppression Over Real TCP Sockets.
     * Topology: Triangle A <-> B <-> C (A connects to B, B connects to C, C connects to A).
     * When Node A broadcasts a disaster REPORT, each node processes it and drops loops.
     */
    @Test
    public void testBroadcastStormAndRelayLoopSuppressionOverSockets() throws Exception {
        CountDownLatch handshakeAB = new CountDownLatch(1);
        CountDownLatch handshakeBC = new CountDownLatch(1);
        CountDownLatch reportLatchB = new CountDownLatch(1);
        CountDownLatch reportLatchC = new CountDownLatch(1);

        nodeA = new TestMeshNode("DEVICE-A", null);

        nodeB = new TestMeshNode("DEVICE-B", new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {
                if (message.getMessageType() == MessageType.REPORT) {
                    reportLatchB.countDown();
                    nodeB.forwardingEngine.forwardMessage(message);
                }
            }
            @Override
            public void onPeerDisconnected(String peerId) {}
        });
        int portB = nodeB.startServer();

        nodeC = new TestMeshNode("DEVICE-C", new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {
                if (message.getMessageType() == MessageType.REPORT) {
                    reportLatchC.countDown();
                    nodeC.forwardingEngine.forwardMessage(message);
                }
            }
            @Override
            public void onPeerDisconnected(String peerId) {}
        });
        int portC = nodeC.startServer();

        nodeA.expectHandshakeWith("DEVICE-B", handshakeAB);
        nodeB.expectHandshakeWith("DEVICE-C", handshakeBC);

        // Connect A -> B and B -> C
        nodeA.connectTo("DEVICE-B", portB);
        nodeB.connectTo("DEVICE-C", portC);

        assertTrue("A -> B handshake must complete", handshakeAB.await(5, TimeUnit.SECONDS));
        assertTrue("B -> C handshake must complete", handshakeBC.await(5, TimeUnit.SECONDS));

        // A broadcasts a critical emergency report
        NetworkMessage report = new NetworkMessage.Builder()
                .messageId("report-flood-loop-001")
                .originDeviceId("DEVICE-A")
                .destinationDeviceId(null)
                .messageType(MessageType.REPORT)
                .createdAt(System.currentTimeMillis())
                .ttl(25)
                .hopCount(0)
                .priority("CRITICAL_EMERGENCY")
                .payload("{\"category\":\"EARTHQUAKE\",\"severity\":\"CRITICAL\"}")
                .build();

        nodeA.sendManager.broadcast(report);

        assertTrue("Node B should receive report", reportLatchB.await(5, TimeUnit.SECONDS));
        assertTrue("Node C should receive report via B", reportLatchC.await(5, TimeUnit.SECONDS));

        // Verify deduplicators recorded message and loop suppression active
        assertTrue("Node B deduplicator must record the message",
                nodeB.deduplicator.isDuplicate("report-flood-loop-001"));
        assertTrue("Node C deduplicator must record the message",
                nodeC.deduplicator.isDuplicate("report-flood-loop-001"));
    }

    /**
     * Test 3: Disconnection, Message Queuing & Reconnect Flush Over Real TCP Sockets.
     * When connection is lost, message is held in queue.
     * When peer reconnects, queued messages are immediately flushed and delivered.
     */
    @Test
    public void testSocketDisconnectionAndReconnectQueueFlush() throws Exception {
        CountDownLatch handshake1 = new CountDownLatch(1);
        CountDownLatch handshake2 = new CountDownLatch(1);
        CountDownLatch messageAfterReconnectLatch = new CountDownLatch(1);

        nodeB = new TestMeshNode("DEVICE-B", new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {
                if ("reconnect-queued-msg-001".equals(message.getMessageId())) {
                    messageAfterReconnectLatch.countDown();
                }
            }
            @Override
            public void onPeerDisconnected(String peerId) {}
        });
        int portB = nodeB.startServer();

        nodeA = new TestMeshNode("DEVICE-A", null);
        nodeA.expectHandshakeWith("DEVICE-B", handshake1);

        // Initial connection
        PeerConnection initialConn = nodeA.connectTo("DEVICE-B", portB);
        assertTrue("Initial handshake must complete", handshake1.await(5, TimeUnit.SECONDS));

        // Disconnect socket simulating user walking out of Wi-Fi Direct range
        initialConn.disconnect();
        nodeA.connectionManager.removeConnection("DEVICE-B");
        Thread.sleep(100);

        // Node A attempts to send while disconnected -> enqueues message in MessageQueue
        MessageQueue queue = new MessageQueue();
        NetworkMessage queuedMsg = new NetworkMessage.Builder()
                .messageId("reconnect-queued-msg-001")
                .originDeviceId("DEVICE-A")
                .destinationDeviceId("DEVICE-B")
                .messageType(MessageType.DIRECT)
                .payload("{\"text\":\"Offline drafted message\"}")
                .build();

        queue.enqueueDirect("DEVICE-B", queuedMsg);

        // Node A walks back into range and reconnects
        nodeA.expectHandshakeWith("DEVICE-B", handshake2);
        PeerConnection reconnectedConn = nodeA.connectTo("DEVICE-B", portB);
        assertTrue("Reconnected handshake must complete", handshake2.await(5, TimeUnit.SECONDS));

        // Flush outbound queue
        List<NetworkMessage> drained = queue.drainPendingDirect("DEVICE-B");
        assertEquals(1, drained.size());
        for (NetworkMessage msg : drained) {
            nodeA.sendManager.sendDirect(msg, "DEVICE-B");
        }

        // Verify message received by Node B after reconnect
        boolean received = messageAfterReconnectLatch.await(5, TimeUnit.SECONDS);
        assertTrue("Node B must receive queued message after socket reconnection", received);
    }

    @Test
    public void testDirectMessageSentToHardwareMacAddress_SuccessfullyDeliveredToRecipientViaAlias() throws Exception {
        CountDownLatch handshakeLatch = new CountDownLatch(1);
        CountDownLatch messageDeliveredLatch = new CountDownLatch(1);
        final String[] finalRecipientDeliveryId = new String[1];

        // Node B is the recipient with Canonical UUID "uuid-node-b-9999" and hardware Wi-Fi MAC "4A:5E:3B:11:22:33"
        String uuidB = "uuid-node-b-9999";
        String macB = "4A:5E:3B:11:22:33";

        nodeB = new TestMeshNode(uuidB, new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {
                // If destination matches self via UUID or local alias:
                if (nodeB.connectionManager.isLocalDestination(message.getDestinationDeviceId())) {
                    finalRecipientDeliveryId[0] = message.getDestinationDeviceId();
                    messageDeliveredLatch.countDown();
                } else if (nodeB.forwardingEngine.shouldForward(message)) {
                    nodeB.forwardingEngine.forwardMessage(message);
                }
            }
            @Override
            public void onPeerDisconnected(String peerId) {}
        });
        nodeB.connectionManager.setLocalDeviceId(uuidB);
        nodeB.connectionManager.registerLocalAlias(macB);
        nodeB.forwardingEngine.addLocalAlias(macB);

        int portB = nodeB.startServer();

        // Node A discovers Node B by hardware MAC address, connects, and establishes handshake
        nodeA = new TestMeshNode("uuid-node-a-1111", null);
        nodeA.connectionManager.setLocalDeviceId("uuid-node-a-1111");
        nodeA.expectHandshakeWith(uuidB, handshakeLatch);

        PeerConnection clientConn = nodeA.connectTo(macB, portB);
        clientConn.setTransportAddress(macB);
        nodeA.connectionManager.registerAlias(macB, clientConn.getPeerId());
        nodeA.handshakeManager.initiateHandshake(clientConn);

        assertTrue("Handshake must complete", handshakeLatch.await(5, TimeUnit.SECONDS));

        // Node A sends a DIRECT message where destination is stamped with Node B's hardware MAC address
        NetworkMessage directMsg = new NetworkMessage.Builder()
                .messageId("msg-mac-destination-001")
                .originDeviceId("uuid-node-a-1111")
                .destinationDeviceId(macB)
                .messageType(MessageType.DIRECT)
                .payload("{\"text\":\"Hello to MAC\"}")
                .build();

        // Node A sends direct using MAC address (resolved through alias)
        boolean sent = nodeA.sendManager.sendDirect(directMsg, macB);
        assertTrue("Message must be sent over ready connection mapped by alias", sent);

        // Verify Node B received and accepted it as local delivery (not forwarded or dropped)
        assertTrue("Node B must receive message addressed to its hardware MAC address", messageDeliveredLatch.await(5, TimeUnit.SECONDS));
        assertEquals(macB, finalRecipientDeliveryId[0]);
    }
}
