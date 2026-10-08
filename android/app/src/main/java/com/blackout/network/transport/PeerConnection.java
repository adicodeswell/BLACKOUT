package com.blackout.network.transport;

import android.util.Log;

import com.blackout.network.protocol.MessageFramer;

import java.io.IOException;
import java.net.Socket;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * Manages an active TCP connection to a single peer.
 * Uses dedicated Read and Write threads to prevent blocking.
 */
public class PeerConnection {
    private static final String TAG = "PeerConnection";

    private String peerId;
    private final Socket socket;
    private final ConnectionListener listener;

    private Thread readThread;
    private Thread writeThread;
    
    // Queue for messages waiting to be sent out
    private final BlockingQueue<byte[]> outbox = new LinkedBlockingQueue<>();
    private volatile boolean isConnected = false;

    public interface ConnectionListener {
        void onMessageReceived(String peerId, byte[] payload);
        void onDisconnected(String peerId);
    }

    public PeerConnection(String peerId, Socket socket, ConnectionListener listener) {
        this.peerId = peerId;
        this.socket = socket;
        this.listener = listener;
    }

    public void start() {
        if (isConnected) return;
        isConnected = true;

        readThread = new Thread(this::readLoop, "PeerRead-" + peerId);
        writeThread = new Thread(this::writeLoop, "PeerWrite-" + peerId);

        readThread.start();
        writeThread.start();
    }

    /**
     * Enqueues a payload to be sent to this peer. Non-blocking.
     */
    public void send(byte[] payload) {
        if (isConnected) {
            outbox.offer(payload);
        }
    }

    public void disconnect() {
        isConnected = false;
        try {
            socket.close();
        } catch (IOException e) {
            Log.e(TAG, "Error closing socket for peer " + peerId, e);
        }
        if (readThread != null) readThread.interrupt();
        if (writeThread != null) writeThread.interrupt();
        
        if (listener != null) {
            listener.onDisconnected(peerId);
        }
    }

    private void readLoop() {
        try {
            while (isConnected && !socket.isClosed()) {
                // Blocks until a full length-prefixed frame arrives
                byte[] payload = MessageFramer.readFrame(socket.getInputStream());
                
                if (listener != null) {
                    listener.onMessageReceived(peerId, payload);
                }
            }
        } catch (IOException e) {
            if (isConnected) {
                Log.w(TAG, "Connection lost to peer: " + peerId, e);
                disconnect();
            }
        }
    }

    private void writeLoop() {
        try {
            while (isConnected && !socket.isClosed()) {
                // Blocks until a message is added to the queue
                byte[] payload = outbox.take();
                
                // Safely frame and write to stream
                MessageFramer.writeFrame(socket.getOutputStream(), payload);
            }
        } catch (InterruptedException e) {
            Log.i(TAG, "Write thread interrupted for peer: " + peerId);
            Thread.currentThread().interrupt();
        } catch (IOException e) {
            if (isConnected) {
                Log.e(TAG, "Failed to send message to peer: " + peerId, e);
                disconnect();
            }
        }
    }

    public String getPeerId() {
        return peerId;
    }
    public void setPeerId(String newId) {
        this.peerId = newId;
    }
}
