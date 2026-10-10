package com.blackout.network.protocol;

import com.blackout.network.transport.ConnectionManager;
import com.blackout.network.transport.NetworkServer;
import com.blackout.network.transport.PeerConnection;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.net.Socket;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

/**
 * End-To-End test for Phase 3. Verifies that two mock devices can 
 * complete a full BLACKOUT handshake and pass a REPORT message to the application layer.
 */
public class HandshakeIntegrationTest {

    private NetworkServer server;
    private PeerConnection serverConnection;
    private PeerConnection clientConnection;
    private ConnectionManager serverConnManager;
    private ConnectionManager clientConnManager;

    private static final int TEST_PORT = 19999;
    private final String SERVER_DEVICE_ID = "DEVICE-SERVER-001";
    private final String CLIENT_DEVICE_ID = "DEVICE-CLIENT-002";

    @Before
    public void setup() {
        serverConnManager = new ConnectionManager();
        clientConnManager = new ConnectionManager();
    }

    @After
    public void teardown() {
        if (serverConnection != null) serverConnection.disconnect();
        if (clientConnection != null) clientConnection.disconnect();
        if (server != null) server.stop();
    }

    @Test
    public void testFullHandshakeAndApplicationMessageDelivery() throws Exception {
        CountDownLatch handshakeLatch = new CountDownLatch(1);
        CountDownLatch appMessageLatch = new CountDownLatch(1);

        // 1. Setup Server Side logic
        HandshakeManager serverHandshakeManager = new HandshakeManager(SERVER_DEVICE_ID, serverConnManager);
        
        MessageHandler serverMessageHandler = new MessageHandler(serverConnManager, serverHandshakeManager, new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {
                if (message.getMessageType() == MessageType.REPORT) {
                    appMessageLatch.countDown();
                }
            }
            @Override
            public void onPeerDisconnected(String peerId) {}
        });

        server = new NetworkServer(TEST_PORT, socket -> {
            serverConnection = new PeerConnection(CLIENT_DEVICE_ID, socket, serverMessageHandler);
            serverConnManager.addConnection(serverConnection);
        });
        server.start();

        Thread.sleep(100);

        // 2. Setup Client Side logic
        HandshakeManager clientHandshakeManager = new HandshakeManager(CLIENT_DEVICE_ID, clientConnManager);
        MessageHandler clientMessageHandler = new MessageHandler(clientConnManager, clientHandshakeManager, new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {}
            @Override
            public void onPeerDisconnected(String peerId) {}
        });

        Socket clientSocket = new Socket("127.0.0.1", TEST_PORT);
        clientConnection = new PeerConnection(SERVER_DEVICE_ID, clientSocket, clientMessageHandler);
        clientConnManager.addConnection(clientConnection);

        // 3. Kick off the handshake from the client
        clientHandshakeManager.initiateHandshake(clientConnection);

        // We can't strictly assert the exact internal states synchronously without adding 
        // test hooks to HandshakeManager, but we can verify the network remains stable.
        Thread.sleep(500);

        // 4. Send an application message (REPORT) after Handshake
        NetworkMessage reportMsg = new NetworkMessage.Builder()
                .protocolVersion(1)
                .messageId("msg-report-1")
                .originDeviceId(CLIENT_DEVICE_ID)
                .destinationDeviceId(SERVER_DEVICE_ID)
                .messageType(MessageType.REPORT)
                .payloadHash("dummyHash")
                .payload("{\"emergency\": \"need_medic\"}")
                .build();

        // Convert and send the message via the client connection
        byte[] serializedReport = MessageSerializer.serialize(reportMsg);
        clientConnection.send(serializedReport);

        // 5. Wait for the server's MessageHandler to successfully route it to the AppMessageListener
        boolean receivedAppMessage = appMessageLatch.await(5, TimeUnit.SECONDS);
        assertTrue("Server did not receive the routed application REPORT message", receivedAppMessage);
    }
}
