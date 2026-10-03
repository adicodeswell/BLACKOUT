package com.blackout.network.reliability;

import com.blackout.network.protocol.MessageType;
import com.blackout.network.protocol.NetworkMessage;

import org.junit.Test;
import java.util.List;
import static org.junit.Assert.*;

public class MessageQueueTest {

    @Test
    public void testDirectMessageQueuingAndDraining() {
        MessageQueue queue = new MessageQueue();
        
        NetworkMessage msg1 = new NetworkMessage.Builder()
                .messageId("msg-1")
                .originDeviceId("device-A")
                .destinationDeviceId("device-B")
                .messageType(MessageType.REPORT)
                .payloadHash("hash1")
                .payload("{}")
                .build();
                
        NetworkMessage msg2 = new NetworkMessage.Builder()
                .messageId("msg-2")
                .originDeviceId("device-A")
                .destinationDeviceId("device-B")
                .messageType(MessageType.DIRECT)
                .payloadHash("hash2")
                .payload("{}")
                .build();

        // Enqueue two messages for device-B
        queue.enqueueDirect("device-B", msg1);
        queue.enqueueDirect("device-B", msg2);
        
        // Drain for device-C should be empty
        assertTrue(queue.drainPendingDirect("device-C").isEmpty());

        // Drain for device-B should have 2 messages
        List<NetworkMessage> drained = queue.drainPendingDirect("device-B");
        assertEquals(2, drained.size());
        assertEquals("msg-1", drained.get(0).getMessageId());
        
        // Calling drain again should yield 0, as they were pulled out
        assertTrue(queue.drainPendingDirect("device-B").isEmpty());
    }
}
