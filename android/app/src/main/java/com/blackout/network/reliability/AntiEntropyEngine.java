package com.blackout.network.reliability;

import android.util.Log;
import com.blackout.data.RoomDataEngine;
import com.blackout.data.entity.NetworkMessageEntity;
import com.blackout.network.protocol.MessageType;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.protocol.MessageHandler;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.*;

/**
 * AntiEntropyEngine - Implements the Epidemic Anti-Entropy Gossip Synchronization
 * protocol for BLACKOUT delay-tolerant mesh networks.
 *
 * Reconciles historical disaster reports, incident updates, hazards, and resources
 * between encountering nodes, resolving the "Newcomer Problem" (issue2.md).
 */
public class AntiEntropyEngine {
    private static final String TAG = "AntiEntropyEngine";

    public interface SyncEventListener {
        void onSyncMessagesIngested(int count);
    }

    private final String localDeviceId;
    private final RoomDataEngine dataEngine;
    private SyncEventListener syncEventListener;

    public AntiEntropyEngine(String localDeviceId, RoomDataEngine dataEngine) {
        this.localDeviceId = localDeviceId;
        this.dataEngine = dataEngine;
    }

    public void setSyncEventListener(SyncEventListener listener) {
        this.syncEventListener = listener;
    }

    /**
     * Builds a QUEUE_SUMMARY message containing a list of recently held message IDs.
     */
    public NetworkMessage createQueueSummary(String destinationDeviceId) {
        List<String> knownIds = new ArrayList<>();
        if (dataEngine != null) {
            knownIds = dataEngine.getRecentMessageIds();
        }

        JSONArray idsArray = new JSONArray();
        for (String id : knownIds) {
            idsArray.put(id);
        }

        JSONObject payload = new JSONObject();
        try {
            payload.put("known_messages", idsArray);
            payload.put("latest_timestamp", System.currentTimeMillis());
            payload.put("node_id", localDeviceId);
        } catch (JSONException e) {
            Log.e(TAG, "Failed to create QUEUE_SUMMARY json", e);
        }

        return new NetworkMessage.Builder()
                .messageId("summary_" + UUID.randomUUID().toString())
                .originDeviceId(localDeviceId)
                .destinationDeviceId(destinationDeviceId)
                .messageType(MessageType.QUEUE_SUMMARY)
                .ttl(2)
                .hopCount(0)
                .priority("NORMAL")
                .payload(payload.toString())
                .payloadHash("summary")
                .signature("")
                .build();
    }

    /**
     * Inspects a peer's incoming QUEUE_SUMMARY and generates a list of missing delta messages
     * to transmit to that peer.
     */
    public List<NetworkMessage> generateSyncDelta(NetworkMessage summaryMsg, String peerId) {
        if (dataEngine == null) return Collections.emptyList();

        Set<String> peerKnownIds = new HashSet<>();
        try {
            JSONObject obj = new JSONObject(summaryMsg.getPayload());
            if (obj.has("known_messages")) {
                JSONArray arr = obj.getJSONArray("known_messages");
                for (int i = 0; i < arr.length(); i++) {
                    peerKnownIds.add(arr.getString(i));
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "Failed to parse QUEUE_SUMMARY payload", e);
        }

        List<NetworkMessageEntity> candidates = dataEngine.getSyncableMessages(peerId);
        List<NetworkMessage> deltaList = new ArrayList<>();

        for (NetworkMessageEntity entity : candidates) {
            if (!peerKnownIds.contains(entity.messageId)) {
                // Peer is missing this message! Reconstruct it for transmission
                try {
                    MessageType origType = MessageType.valueOf(entity.messageType);
                    NetworkMessage msg = new NetworkMessage.Builder()
                            .messageId(entity.messageId)
                            .originDeviceId(entity.originDeviceId)
                            .destinationDeviceId(entity.destinationDeviceId)
                            .messageType(origType)
                            .createdAt(entity.createdAt)
                            .ttl(Math.max(1, entity.ttl))
                            .hopCount(entity.hopCount)
                            .priority(entity.priority != null ? entity.priority : "NORMAL")
                            .payload(entity.payload)
                            .payloadHash(entity.payloadHash != null ? entity.payloadHash : "")
                            .signature(entity.signature != null ? entity.signature : "")
                            .build();
                    deltaList.add(msg);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to reconstruct delta message: " + entity.messageId, e);
                }
            }
        }

        Log.i(TAG, "Generated " + deltaList.size() + " sync delta messages for peer " + peerId);
        return deltaList;
    }

    /**
     * Unpacks and ingests incoming SYNC or delta messages received from a peer,
     * saving them into the local RoomDataEngine and notifying the application.
     */
    public void handleIncomingSync(NetworkMessage syncMsg, MessageHandler.AppMessageListener appListener, String sourcePeerId) {
        if (dataEngine == null) return;

        int ingestedCount = 0;
        try {
            JSONObject payloadObj = new JSONObject(syncMsg.getPayload());
            if (payloadObj.has("sync_messages")) {
                JSONArray arr = payloadObj.getJSONArray("sync_messages");
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject itemObj = arr.getJSONObject(i);
                    String msgId = itemObj.getString("message_id");

                    // Check if already present
                    if (dataEngine.getMessageEntity(msgId) == null) {
                        String origTypeStr = itemObj.getString("message_type");
                        MessageType msgType = MessageType.valueOf(origTypeStr);

                        NetworkMessage reconstructed = new NetworkMessage.Builder()
                                .messageId(msgId)
                                .originDeviceId(itemObj.getString("origin_device_id"))
                                .destinationDeviceId(itemObj.optString("destination_device_id", null))
                                .messageType(msgType)
                                .createdAt(itemObj.optLong("created_at", System.currentTimeMillis()))
                                .ttl(itemObj.optInt("ttl", 5))
                                .hopCount(itemObj.optInt("hop_count", 0))
                                .priority(itemObj.optString("priority", "NORMAL"))
                                .payload(itemObj.get("payload").toString())
                                .payloadHash(itemObj.optString("payload_hash", ""))
                                .signature(itemObj.optString("signature", ""))
                                .build();

                        dataEngine.saveMessage(reconstructed, "RECEIVED");
                        ingestedCount++;

                        if (appListener != null) {
                            appListener.onApplicationMessage(sourcePeerId, reconstructed);
                        }
                    }
                }
            } else {
                // Single message payload delivered via SYNC envelope
                if (dataEngine.getMessageEntity(syncMsg.getMessageId()) == null) {
                    dataEngine.saveMessage(syncMsg, "RECEIVED");
                    ingestedCount++;
                    if (appListener != null) {
                        appListener.onApplicationMessage(sourcePeerId, syncMsg);
                    }
                }
            }
        } catch (JSONException e) {
            // Not a multi-message batch; process directly as single message
            if (dataEngine.getMessageEntity(syncMsg.getMessageId()) == null) {
                dataEngine.saveMessage(syncMsg, "RECEIVED");
                ingestedCount++;
                if (appListener != null) {
                    appListener.onApplicationMessage(sourcePeerId, syncMsg);
                }
            }
        }

        if (ingestedCount > 0 && syncEventListener != null) {
            syncEventListener.onSyncMessagesIngested(ingestedCount);
        }
        Log.i(TAG, "Ingested " + ingestedCount + " synchronized messages from " + sourcePeerId);
    }
}
