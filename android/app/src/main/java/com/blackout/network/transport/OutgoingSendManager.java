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

    public boolean sendDirect(NetworkMessage msg, String peerId) {
        PeerConnection peer = connectionManager.getReadyConnection(peerId);
        if (peer != null) {
            try {
                byte[] bytes = MessageSerializer.serialize(msg);
                peer.send(bytes);
                return true;
            } catch (JSONException e) {
                Log.e(TAG, "Failed to serialize direct message", e);
                return false;
            }
        } else {
            Log.e(TAG, "Peer ID mismatch or no connection for " + peerId + ".");
            return false;
        }
    }

    public boolean broadcast(NetworkMessage msg) {
        try {
            byte[] bytes = MessageSerializer.serialize(msg);
            return connectionManager.broadcast(bytes);
        } catch (JSONException e) {
            Log.e(TAG, "Failed to serialize broadcast message", e);
            return false;
        }
    }
}
