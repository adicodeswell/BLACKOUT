package com.blackout.network.protocol;

import org.json.JSONException;
import org.junit.Test;

import static org.junit.Assert.*;

public class MessageSerializerTest {

    @Test
    public void testSerializationRoundTrip() throws JSONException {
        // 1. Create an immutable message
        NetworkMessage original = new NetworkMessage.Builder()
                .protocolVersion(1)
                .messageId("msg-1234")
                .originDeviceId("device-A")
                .destinationDeviceId("device-B")
                .messageType(MessageType.REPORT)
                .ttl(5)
                .hopCount(0)
                .priority("HIGH")
                .payloadHash("abcdef123456")
                .payload("{\"emergency\": \"fire\"}")
                .build();

        // 2. Serialize to bytes
        byte[] rawBytes = MessageSerializer.serialize(original);
        assertNotNull(rawBytes);
        assertTrue(rawBytes.length > 0);

        // 3. Deserialize back to an object
        NetworkMessage reconstructed = MessageSerializer.deserialize(rawBytes);

        // 4. Assert all fields perfectly match (No data loss)
        assertEquals(original.getProtocolVersion(), reconstructed.getProtocolVersion());
        assertEquals(original.getMessageId(), reconstructed.getMessageId());
        assertEquals(original.getOriginDeviceId(), reconstructed.getOriginDeviceId());
        assertEquals(original.getDestinationDeviceId(), reconstructed.getDestinationDeviceId());
        assertEquals(original.getMessageType(), reconstructed.getMessageType());
        assertEquals(original.getTtl(), reconstructed.getTtl());
        assertEquals(original.getHopCount(), reconstructed.getHopCount());
        assertEquals(original.getPriority(), reconstructed.getPriority());
        assertEquals(original.getPayloadHash(), reconstructed.getPayloadHash());
        assertEquals(original.getPayload(), reconstructed.getPayload());
    }

    @Test
    public void testValidatorAcceptsValidMessage() {
        NetworkMessage validMessage = new NetworkMessage.Builder()
                .protocolVersion(1)
                .messageId("msg-123")
                .originDeviceId("device-A")
                .messageType(MessageType.HELLO)
                .payloadHash("hash123")
                .payload("{}")
                .build();

        try {
            MessageValidator.validate(validMessage);
            // If we reach here, it passed validation
        } catch (MessageValidator.ValidationException e) {
            fail("Valid message should not throw an exception");
        }
    }

    @Test
    public void testValidatorRejectsMalformedMessage() {
        // Negative TTL is not allowed
        NetworkMessage invalidMessage = new NetworkMessage.Builder()
                .protocolVersion(1)
                .messageId("msg-123")
                .originDeviceId("device-A")
                .messageType(MessageType.HELLO)
                .ttl(-1) // Invalid!
                .payloadHash("hash123")
                .payload("{}")
                .build();

        try {
            MessageValidator.validate(invalidMessage);
            fail("Expected ValidationException was not thrown");
        } catch (MessageValidator.ValidationException e) {
            assertTrue(e.getMessage().contains("TTL cannot be negative"));
        }
    }
}
