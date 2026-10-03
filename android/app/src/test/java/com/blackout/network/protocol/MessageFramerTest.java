package com.blackout.network.protocol;

import org.junit.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;

public class MessageFramerTest {

    @Test
    public void testFramingRoundTrip() throws IOException {
        String testPayloadString = "{\"type\": \"HELLO_WORLD\"}";
        byte[] originalPayload = testPayloadString.getBytes();

        // 1. Simulate an outgoing socket stream
        ByteArrayOutputStream outStream = new ByteArrayOutputStream();
        
        // 2. Wrap the payload using the Framer (adds 4-byte length prefix)
        MessageFramer.writeFrame(outStream, originalPayload);
        
        byte[] framedNetworkBytes = outStream.toByteArray();
        // The framed bytes should be exactly 4 bytes longer than the payload
        assertEquals(originalPayload.length + 4, framedNetworkBytes.length);

        // 3. Simulate an incoming socket stream
        ByteArrayInputStream inStream = new ByteArrayInputStream(framedNetworkBytes);
        
        // 4. Unwrap the payload using the Framer
        byte[] receivedPayload = MessageFramer.readFrame(inStream);

        // 5. Assert the received payload matches the original perfectly
        assertArrayEquals(originalPayload, receivedPayload);
    }
}
