package com.blackout.network.protocol;

import org.junit.Test;
import com.blackout.network.protocol.MessageValidator.ValidationException;

import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

public class MessageValidatorTest {

    private NetworkMessage.Builder createBaseBuilder() {
        return new NetworkMessage.Builder()
                .messageId("msg-1")
                .originDeviceId("device-1")
                .messageType(MessageType.REPORT)
                .payloadHash("hash")
                .payload("{}");
    }

    @Test
    public void testValidReportMessage() throws Exception {
        NetworkMessage msg = createBaseBuilder().build();
        MessageValidator.validate(msg); // Should not throw
    }

    @Test
    public void testDirectMessageMissingDestinationRejected() {
        NetworkMessage msg = createBaseBuilder()
                .messageType(MessageType.DIRECT)
                .encryption(new NetworkMessage.EncryptionMetadata("AES_GCM", "key1", "nonce1"))
                .build();
                
        ValidationException exception = assertThrows(MessageValidator.ValidationException.class, () -> {
            MessageValidator.validate(msg);
        });
        assertTrue(exception.getMessage().contains("must have a destination_device_id"));
    }

    @Test
    public void testValidDirectMessage() throws Exception {
        NetworkMessage msg = createBaseBuilder()
                .messageType(MessageType.DIRECT)
                .destinationDeviceId("device-2")
                // encryption not set
                .build();
                
        MessageValidator.validate(msg); // Should not throw
    }
}
