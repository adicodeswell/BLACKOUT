package com.blackout.network.protocol;

import android.util.Log;
import com.blackout.network.transport.ConnectionManager;
import com.blackout.network.transport.PeerConnection;
import org.json.JSONException;
import com.blackout.network.reliability.MessageDeduplicator;

/**
 * The Receive Pipeline. Parses incoming bytes, routes handshakes back to the HandshakeManager,
 * and routes application payloads to the rest of the app.
 */
public class MessageHandler implements PeerConnection.ConnectionListener {
    private static final String TAG = "MessageHandler";
    
    private final ConnectionManager connectionManager;
    private final HandshakeManager handshakeManager;
    private final AppMessageListener appListener;
    private final MessageDeduplicator deduplicator;
    private com.blackout.network.reliability.AntiEntropyEngine antiEntropyEngine;

    public interface AppMessageListener {
        default void onApplicationMessage(NetworkMessage message) {}
        default void onApplicationMessage(String sourcePeerId, NetworkMessage message) {
            onApplicationMessage(message);
        }
        void onPeerDisconnected(String peerId);
    }

    public MessageHandler(ConnectionManager connectionManager, HandshakeManager handshakeManager, AppMessageListener appListener) {
        this(connectionManager, handshakeManager, new MessageDeduplicator(), appListener);
    }

    public MessageHandler(ConnectionManager connectionManager, HandshakeManager handshakeManager, MessageDeduplicator deduplicator, AppMessageListener appListener) {
        this.connectionManager = connectionManager;
        this.handshakeManager = handshakeManager;
        this.deduplicator = deduplicator != null ? deduplicator : new MessageDeduplicator();
        this.appListener = appListener;
    }

    public void setAntiEntropyEngine(com.blackout.network.reliability.AntiEntropyEngine engine) {
        this.antiEntropyEngine = engine;
    }

    public com.blackout.network.reliability.AntiEntropyEngine getAntiEntropyEngine() {
        return this.antiEntropyEngine;
    }

    @Override
    public void onMessageReceived(String peerId, byte[] payload) {
        try {
            NetworkMessage msg = MessageSerializer.deserialize(payload);
            MessageValidator.validate(msg);

            // Mesh Routing Loop Prevention
            if (deduplicator.isDuplicate(msg.getMessageId())) {
                Log.d(TAG, "Dropped duplicate mesh message: " + msg.getMessageId());
                return;
            }
            deduplicator.recordMessage(msg.getMessageId());

            MessageType type = msg.getMessageType();
            
            if (type == MessageType.HELLO || type == MessageType.HELLO_ACK || 
                type == MessageType.CAPABILITIES || type == MessageType.CAPABILITIES_ACK ||
                type == MessageType.QUEUE_SUMMARY) {
                
                // Intercept protocol-level handshakes
                PeerConnection peer = connectionManager.getConnection(peerId);
                if (peer != null) {
                    handshakeManager.processHandshakeMessage(msg, peer);
                }
            } else if (type == MessageType.SYNC) {
                // Route anti-entropy synchronization batches
                if (antiEntropyEngine != null) {
                    antiEntropyEngine.handleIncomingSync(msg, appListener, peerId);
                } else if (appListener != null) {
                    appListener.onApplicationMessage(peerId, msg);
                }
            } else {
                // Route application-level messages (REPORT, DIRECT, ACK, HAZARD, etc) upward
                if (appListener != null) {
                    appListener.onApplicationMessage(peerId, msg);
                }
            }
        } catch (MessageValidator.ValidationException | JSONException e) {
            Log.e(TAG, "Dropped malformed message from peer: " + peerId, e);
        }
    }

    @Override
    public void onDisconnected(String peerId) {
        Log.i(TAG, "Peer disconnected in MessageHandler: " + peerId);
        connectionManager.removeConnection(peerId);
        if (appListener != null) {
            appListener.onPeerDisconnected(peerId);
        }
    }
}
