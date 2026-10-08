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
    private final MessageDeduplicator deduplicator = new MessageDeduplicator();

    public interface AppMessageListener {
        void onApplicationMessage(NetworkMessage message);
        void onPeerDisconnected(String peerId);
    }

    public MessageHandler(ConnectionManager connectionManager, HandshakeManager handshakeManager, AppMessageListener appListener) {
        this.connectionManager = connectionManager;
        this.handshakeManager = handshakeManager;
        this.appListener = appListener;
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
            } else {
                // Route application-level messages (REPORT, HAZARD, etc) upward
                if (appListener != null) {
                    appListener.onApplicationMessage(msg);
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
