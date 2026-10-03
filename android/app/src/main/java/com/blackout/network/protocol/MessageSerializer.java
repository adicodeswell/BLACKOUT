package com.blackout.network.protocol;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;

public class MessageSerializer {

    public static byte[] serialize(NetworkMessage message) throws JSONException {
        JSONObject json = new JSONObject();
        json.put("protocol_version", message.getProtocolVersion());
        json.put("message_id", message.getMessageId());
        json.put("origin_device_id", message.getOriginDeviceId());
        
        if (message.getDestinationDeviceId() != null) {
            json.put("destination_device_id", message.getDestinationDeviceId());
        }
        
        json.put("message_type", message.getMessageType().name());
        json.put("created_at", message.getCreatedAt());
        json.put("ttl", message.getTtl());
        json.put("hop_count", message.getHopCount());
        json.put("priority", message.getPriority());
        json.put("payload_hash", message.getPayloadHash());
        try {
            // Try to nest it cleanly as a JSON Object so it matches the TypeScript `unknown` object contract
            json.put("payload", new JSONObject(message.getPayload()));
        } catch (JSONException e) {
            // Fallback to raw string if it's not a JSON object
            json.put("payload", message.getPayload());
        }
        
        if (message.getSignature() != null) {
            json.put("signature", message.getSignature());
        }

        return json.toString().getBytes(StandardCharsets.UTF_8);
    }

    public static NetworkMessage deserialize(byte[] data) throws JSONException, IllegalArgumentException {
        String jsonString = new String(data, StandardCharsets.UTF_8);
        JSONObject json = new JSONObject(jsonString);

        NetworkMessage.Builder builder = new NetworkMessage.Builder()
                .protocolVersion(json.getInt("protocol_version"))
                .messageId(json.getString("message_id"))
                .originDeviceId(json.getString("origin_device_id"))
                .messageType(MessageType.valueOf(json.getString("message_type")))
                .createdAt(json.getLong("created_at"))
                .ttl(json.getInt("ttl"))
                .hopCount(json.getInt("hop_count"))
                .priority(json.getString("priority"))
                .payloadHash(json.getString("payload_hash"))
                .payload(json.get("payload").toString());

        if (json.has("destination_device_id")) {
            builder.destinationDeviceId(json.getString("destination_device_id"));
        }
        
        if (json.has("signature")) {
            builder.signature(json.getString("signature"));
        }

        return builder.build();
    }
}
