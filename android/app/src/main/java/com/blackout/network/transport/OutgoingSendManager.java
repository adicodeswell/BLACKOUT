package com.blackout.network.transport;

import android.util.Log;
import com.blackout.network.protocol.MessageSerializer;
import com.blackout.network.protocol.NetworkMessage;
import org.json.JSONException;

/**
 * Handles outgoing message routing. Uses the ConnectionManager to 
 * find the right socket to send messages out over the mesh.
 */
public class OutgoingSendManager {
    private static final String TAG = "OutgoingSendManager";
    
    private final ConnectionManager connectionManager;

    public OutgoingSendManager(ConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    public void sendDirect(NetworkMessage msg, String peerId) {
        PeerConnection peer = connectionManager.getConnection(peerId);
        if (peer != null) {
            try {
                byte[] bytes = MessageSerializer.serialize(msg);
                peer.send(bytes);
            } catch (JSONException e) {
                Log.e(TAG, "Failed to serialize direct message", e);
            }
        } else {
            Log.w(TAG, "Peer not found or disconnected: " + peerId);
            // In Phase 4, we will push this to the persistent queue for Store-And-Forward
        }
    }

    public void broadcast(NetworkMessage msg) {
        try {
            byte[] bytes = MessageSerializer.serialize(msg);
            connectionManager.broadcast(bytes);
        } catch (JSONException e) {
            Log.e(TAG, "Failed to serialize broadcast message", e);
        }
    }
}
