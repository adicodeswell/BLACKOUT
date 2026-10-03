package com.blackout.network.transport;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.net.Socket;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class NetworkTransportTest {

    private NetworkServer server;
    private PeerConnection serverSideConnection;
    private PeerConnection clientSideConnection;
    
    // We use a high port for local testing to avoid conflicts
    private static final int TEST_PORT = 18888; 

    @Before
    public void setup() {
        // Prepare for fresh connections before each test
        serverSideConnection = null;
        clientSideConnection = null;
    }

    @After
    public void teardown() {
        if (clientSideConnection != null) clientSideConnection.disconnect();
        if (serverSideConnection != null) serverSideConnection.disconnect();
        if (server != null) server.stop();
    }

    @Test
    public void testThousandMessageBlastOverLocalhost() throws Exception {
        final int MESSAGE_COUNT = 1000;
        final CountDownLatch latch = new CountDownLatch(MESSAGE_COUNT);
        final List<String> receivedPayloads = Collections.synchronizedList(new ArrayList<>());

        // 1. Start the NetworkServer on localhost
        server = new NetworkServer(TEST_PORT, socket -> {
            // This callback fires when the client connects
            serverSideConnection = new PeerConnection("client-peer", socket, new PeerConnection.ConnectionListener() {
                @Override
                public void onMessageReceived(String peerId, byte[] payload) {
                    receivedPayloads.add(new String(payload));
                    latch.countDown(); // Decrement our counter
                }

                @Override
                public void onDisconnected(String peerId) {
                }
            });
            serverSideConnection.start();
        });
        server.start();

        // Give the server a tiny fraction of a second to spin up its thread
        Thread.sleep(100);

        // 2. Client connects to the localhost server
        Socket clientSocket = new Socket("127.0.0.1", TEST_PORT);
        
        clientSideConnection = new PeerConnection("server-peer", clientSocket, new PeerConnection.ConnectionListener() {
            @Override
            public void onMessageReceived(String peerId, byte[] payload) { }
            @Override
            public void onDisconnected(String peerId) { }
        });
        clientSideConnection.start();

        // 3. Blast 1,000 messages from the Client to the Server as fast as possible
        String baseMessage = "{\"msg\": \"Hello TCP Framing!\", \"id\": ";
        for (int i = 0; i < MESSAGE_COUNT; i++) {
            String msg = baseMessage + i + "}";
            clientSideConnection.send(msg.getBytes());
        }

        // 4. Wait for the server to receive all 1,000 messages (timeout after 5 seconds just in case)
        boolean receivedAll = latch.await(5, TimeUnit.SECONDS);

        // 5. Verify the results
        assertTrue("Server did not receive all 1000 messages within the timeout! Only received: " + receivedPayloads.size(), receivedAll);
        assertEquals("Server should have exactly 1000 messages", MESSAGE_COUNT, receivedPayloads.size());
        
        // Ensure packets didn't merge by checking the first and last message
        assertEquals("{\"msg\": \"Hello TCP Framing!\", \"id\": 0}", receivedPayloads.get(0));
        assertEquals("{\"msg\": \"Hello TCP Framing!\", \"id\": 999}", receivedPayloads.get(999));
    }
}
