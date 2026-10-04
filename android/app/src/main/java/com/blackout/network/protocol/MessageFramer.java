package com.blackout.network.protocol;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Solves the TCP streaming problem by prepending a 4-byte length integer
 * to every message. This allows the receiver to perfectly reconstruct
 * the JSON payload without messages merging together.
 */
public class MessageFramer {

    /**
     * Reads exactly one complete framed message from the input stream.
     * Blocks until a full message is available.
     *
     * @param in The raw TCP socket input stream.
     * @return The exact byte payload of the message.
     * @throws IOException If the connection is closed or stream is corrupted.
     */
    public static byte[] readFrame(InputStream in) throws IOException {
        DataInputStream dataIn = new DataInputStream(in);
        
        // 1. Read the 4-byte integer representing the length of the payload
        int length = dataIn.readInt();
        
        if (length <= 0 || length > 10 * 1024 * 1024) { 
            // Sanity check: prevent allocating massive memory if bytes are corrupt (e.g. max 10MB)
            throw new IOException("Invalid frame length: " + length);
        }

        // 2. Read exactly 'length' bytes
        byte[] payload = new byte[length];
        dataIn.readFully(payload);

        return payload;
    }

    /**
     * Wraps the payload with a 4-byte length header and writes it directly to the stream.
     * 
     * @param out The raw TCP socket output stream.
     * @param payload The serialized JSON byte array.
     * @throws IOException If writing fails.
     */
    public static void writeFrame(OutputStream out, byte[] payload) throws IOException {
        DataOutputStream dataOut = new DataOutputStream(out);
        
        // 1. Write the exactly 4-byte integer length
        dataOut.writeInt(payload.length);
        
        // 2. Write the actual payload
        dataOut.write(payload);
        
        // 3. Flush to ensure it goes over the network immediately
        dataOut.flush();
    }
}
