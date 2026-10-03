package com.blackout.network.reliability;

import com.blackout.network.protocol.MessageType;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.transport.ConnectionManager;
import com.blackout.network.transport.OutgoingSendManager;

import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;

public class ForwardingEngineTest {

    private ForwardingEngine engine;

    @Before
    public void setup() {
        ConnectionManager connManager = new ConnectionManager();
        OutgoingSendManager sendManager = new OutgoingSendManager(connManager);
        MessageDeduplicator dedup = new MessageDeduplicator();
        
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
}
