package com.blackout.data.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "network_messages")
public class NetworkMessageEntity {
    @PrimaryKey
    @NonNull
    public String messageId;

    public int protocolVersion;
    public String originDeviceId;
    public String destinationDeviceId;
    public String messageType;
    public long createdAt;
    public int ttl;
    public int hopCount;
    public String priority;
    public String payloadHash;
    public String payload;
    public String signature;

    // Encryption metadata
    public String encryptionAlgorithm;
    public String encryptionKeyId;
    public String encryptionNonce;

    // Delivery Status tracking
    public String deliveryState; // "CREATED", "QUEUED", "SENT", "DELIVERED"
    public int deliveryAttempts;
    public long deliveredAt;
    public boolean isRead;
}
