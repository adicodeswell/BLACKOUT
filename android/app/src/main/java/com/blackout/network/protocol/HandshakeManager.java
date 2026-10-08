package com.blackout.network.protocol;

import android.util.Log;
import com.blackout.network.transport.ConnectionManager;
import com.blackout.network.transport.PeerConnection;
import org.json.JSONException;

import java.util.UUID;

/**
 * Manages the BLACKOUT HELLO and CAPABILITIES handshake protocol.
 */
public class HandshakeManager {
    private static final String TAG = "HandshakeManager";
    
    private final String localDeviceId;
    private final ConnectionManager connectionManager;

    public HandshakeManager(String localDeviceId, ConnectionManager connectionManager) {
        this.localDeviceId = localDeviceId;
        this.connectionManager = connectionManager;
    }

    /**
     * Called when we connect to a new peer to initiate the handshake.
     */
    public void initiateHandshake(PeerConnection peer) {
        NetworkMessage helloMsg = new NetworkMessage.Builder()
                .protocolVersion(1)
                .messageId(UUID.randomUUID().toString())
                .originDeviceId(localDeviceId)
                .destinationDeviceId(peer.getPeerId())
                .messageType(MessageType.HELLO)
                .payloadHash("none")
                .payload("{}")
                .build();
        
        sendToPeer(peer, helloMsg);
        Log.i(TAG, "Initiated Handshake (Sent HELLO) to peer: " + peer.getPeerId());
    }

    /**
     * Responds to incoming handshake steps.
     */
    public void processHandshakeMessage(NetworkMessage msg, PeerConnection peer) {
        switch (msg.getMessageType()) {
            case HELLO:
                NetworkMessage ack = new NetworkMessage.Builder()
                        .protocolVersion(1)
                        .messageId(UUID.randomUUID().toString())
                        .originDeviceId(localDeviceId)
                        .destinationDeviceId(msg.getOriginDeviceId())
                        .messageType(MessageType.HELLO_ACK)
                        .payloadHash("none")
                        .payload("{\"ack_to\": \"" + msg.getMessageId() + "\"}")
                        .build();
                // Rename the connection to the true sender's ID!
                connectionManager.updateConnectionId(peer.getPeerId(), msg.getOriginDeviceId());
                sendToPeer(peer, ack);
                Log.i(TAG, "Sent HELLO_ACK to peer: " + msg.getOriginDeviceId());
                break;
                
            case HELLO_ACK:
                NetworkMessage caps = new NetworkMessage.Builder()
                        .protocolVersion(1)
                        .messageId(UUID.randomUUID().toString())
                        .originDeviceId(localDeviceId)
                        .destinationDeviceId(msg.getOriginDeviceId())
                        .messageType(MessageType.CAPABILITIES)
                        .payloadHash("none")
                        .payload("{\"capabilities\": [\"STORE_AND_FORWARD\", \"GPS\"]}")
                        .build();
                sendToPeer(peer, caps);
                Log.i(TAG, "Sent CAPABILITIES to peer: " + msg.getOriginDeviceId());
                break;
                
            case CAPABILITIES:
                NetworkMessage capAck = new NetworkMessage.Builder()
                        .protocolVersion(1)
                        .messageId(UUID.randomUUID().toString())
                        .originDeviceId(localDeviceId)
                        .destinationDeviceId(msg.getOriginDeviceId())
                        .messageType(MessageType.CAPABILITIES_ACK)
                        .payloadHash("none")
                        .payload("{\"ack_to\": \"" + msg.getMessageId() + "\"}")
                        .build();
                sendToPeer(peer, capAck);
                Log.i(TAG, "Sent CAPABILITIES_ACK to peer: " + msg.getOriginDeviceId());
                
                // Immediately send our QUEUE_SUMMARY
                sendQueueSummary(peer, msg.getOriginDeviceId());
                break;
                
            case CAPABILITIES_ACK:
                // We received their CAPABILITIES_ACK, now we must send our QUEUE_SUMMARY
                sendQueueSummary(peer, msg.getOriginDeviceId());
                break;
                
            case QUEUE_SUMMARY:
                Log.i(TAG, "Handshake COMPLETE. Peer is fully READY: " + msg.getOriginDeviceId());
                // In Phase 4, we will use the payload payload to trigger syncs.
                // Here we would upgrade the PeerInfo status from HANDSHAKING to READY.
                break;
                
            default:
                break;
        }
    }

    private void sendQueueSummary(PeerConnection peer, String destId) {
        NetworkMessage queueSummary = new NetworkMessage.Builder()
                .protocolVersion(1)
                .messageId(UUID.randomUUID().toString())
                .originDeviceId(localDeviceId)
                .destinationDeviceId(destId)
                .messageType(MessageType.QUEUE_SUMMARY)
                .payloadHash("none")
                .payload("{\"known_messages\": []}") // Dummy empty queue for now
                .build();
        sendToPeer(peer, queueSummary);
        Log.i(TAG, "Sent QUEUE_SUMMARY to peer: " + destId);
    }

    private void sendToPeer(PeerConnection peer, NetworkMessage msg) {
        try {
            byte[] bytes = MessageSerializer.serialize(msg);
            peer.send(bytes);
        } catch (JSONException e) {
            Log.e(TAG, "Failed to serialize handshake message", e);
        }
    }
}
