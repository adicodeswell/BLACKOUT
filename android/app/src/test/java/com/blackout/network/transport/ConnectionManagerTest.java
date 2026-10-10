package com.blackout.network.transport;

import org.junit.Before;
import org.junit.Test;
import java.net.Socket;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public class ConnectionManagerTest {

    private ConnectionManager connectionManager;

    static class DummySocket extends Socket {
        @Override
        public InputStream getInputStream() { 
            return new InputStream() {
                @Override
                public int read() {
                    try { Thread.sleep(100000); } catch (InterruptedException e) {}
                    return -1;
                }
            }; 
        }
        @Override
        public OutputStream getOutputStream() { return new ByteArrayOutputStream(); }
    }

    static class DummyPeerConnection extends PeerConnection {
        boolean disconnected = false;
        boolean ready = false;
        String id;
        
        public DummyPeerConnection(String peerId, boolean ready) {
            super(peerId, new DummySocket(), null);
            this.id = peerId;
            this.ready = ready;
        }
        @Override
        public String getPeerId() { return id; }
        @Override
        public void setPeerId(String newId) { this.id = newId; }
        @Override
        public boolean isReady() { return ready; }
        @Override
        public void disconnect() { this.disconnected = true; }
    }

    @Before
    public void setup() {
        connectionManager = new ConnectionManager();
    }

    @Test
    public void testConnectionCollision_PreservesReadyConnection() {
        DummyPeerConnection existingConn = new DummyPeerConnection("nodeA", true);
        DummyPeerConnection newConn = new DummyPeerConnection("temp-123", false);

        connectionManager.addConnection(existingConn);
        connectionManager.addConnection(newConn);

        boolean promoted = connectionManager.updateConnectionId("temp-123", "nodeA", "localNode");

        assertFalse(promoted);
        assertTrue(newConn.disconnected);
        assertFalse(existingConn.disconnected);
        assertEquals(existingConn, connectionManager.getConnection("nodeA"));
    }

    @Test
    public void testConnectionCollision_DeterministicResolution() {
        DummyPeerConnection existingConn = new DummyPeerConnection("nodeA", false);
        DummyPeerConnection newConn = new DummyPeerConnection("temp-123", false);

        connectionManager.addConnection(existingConn);
        connectionManager.addConnection(newConn);

        boolean promoted = connectionManager.updateConnectionId("temp-123", "nodeA", "nodeB");
        assertTrue(promoted);
        assertTrue(existingConn.disconnected);
        assertEquals("nodeA", newConn.getPeerId());
        assertEquals(newConn, connectionManager.getConnection("nodeA"));
    }

    @Test
    public void testAliasMappingResolution() {
        DummyPeerConnection conn = new DummyPeerConnection("temp-123", false);
        
        connectionManager.addConnection(conn);
        connectionManager.updateConnectionId("temp-123", "nodeA", "localNode");
        
        assertEquals(conn, connectionManager.getConnection("nodeA"));
        assertEquals(conn, connectionManager.getConnection("temp-123"));
    }
}
