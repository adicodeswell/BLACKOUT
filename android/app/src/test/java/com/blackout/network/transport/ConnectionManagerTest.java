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

    @Test
    public void testLocalAlias_RecognizesHardwareMacAddressAndCaseInsensitive() {
        connectionManager.setLocalDeviceId("f81d4fae-7dec-11d0-a765-00a0c91e6bf6");
        connectionManager.registerLocalAlias("4A:5E:3B:11:22:33");

        // Canonical UUID is recognized as local
        assertTrue("Canonical UUID must be recognized as local destination",
                connectionManager.isLocalDestination("f81d4fae-7dec-11d0-a765-00a0c91e6bf6"));

        // Uppercase and lowercase MAC addresses must be recognized as local
        assertTrue("Uppercase MAC must be recognized as local destination",
                connectionManager.isLocalDestination("4A:5E:3B:11:22:33"));
        assertTrue("Lowercase MAC must be recognized as local destination",
                connectionManager.isLocalDestination("4a:5e:3b:11:22:33"));

        // Unrelated address is not local
        assertFalse("Unrelated MAC should not be recognized as local",
                connectionManager.isLocalDestination("AA:BB:CC:DD:EE:FF"));
    }

    @Test
    public void testRemoteAlias_ResolvesMacAddressToCanonicalUuidCaseInsensitively() {
        String canonicalUuid = "b0b0b0b0-0000-1111-2222-333344445555";
        String hardwareMac = "4A:5E:3B:11:22:33";

        DummyPeerConnection conn = new DummyPeerConnection(canonicalUuid, true);
        conn.setTransportAddress(hardwareMac);
        connectionManager.addConnection(conn);
        connectionManager.registerAlias(hardwareMac, canonicalUuid);

        // Resolution by exact MAC
        assertEquals(canonicalUuid, connectionManager.resolveCanonicalId("4A:5E:3B:11:22:33"));
        // Resolution by lowercase MAC
        assertEquals(canonicalUuid, connectionManager.resolveCanonicalId("4a:5e:3b:11:22:33"));

        // Connection retrieval by lowercase MAC
        assertEquals(conn, connectionManager.getConnection("4a:5e:3b:11:22:33"));
        assertEquals(conn, connectionManager.getReadyConnection("4a:5e:3b:11:22:33"));

        // Reverse lookup
        assertEquals("4a:5e:3b:11:22:33", connectionManager.resolveTransportAddress(canonicalUuid).toLowerCase());
    }
}
