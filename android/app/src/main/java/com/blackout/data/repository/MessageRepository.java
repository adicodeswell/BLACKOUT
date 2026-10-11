package com.blackout.data.repository;

import com.blackout.data.dao.NetworkMessageDao;
import com.blackout.data.entity.NetworkMessageEntity;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.protocol.MessageType;

public class MessageRepository {

    private final NetworkMessageDao dao;

    public MessageRepository(NetworkMessageDao dao) {
        this.dao = dao;
    }

    public void saveMessage(NetworkMessage msg) {
        saveMessage(msg, "QUEUED");
    }

    public void saveMessage(NetworkMessage msg, String deliveryState) {
        NetworkMessageEntity entity = new NetworkMessageEntity();
        entity.messageId = msg.getMessageId();
        entity.protocolVersion = msg.getProtocolVersion();
        entity.originDeviceId = msg.getOriginDeviceId();
        entity.destinationDeviceId = msg.getDestinationDeviceId();
        entity.messageType = msg.getMessageType().name();
        entity.payloadHash = msg.getPayloadHash();
        entity.payload = msg.getPayload();
        entity.ttl = msg.getTtl();
        entity.hopCount = msg.getHopCount();
        entity.priority = msg.getPriority() != null ? msg.getPriority() : "NORMAL";
        entity.signature = msg.getSignature();
        
        if (msg.getEncryption() != null) {
            entity.encryptionAlgorithm = msg.getEncryption().getAlgorithm();
            entity.encryptionKeyId = msg.getEncryption().getKeyId();
            entity.encryptionNonce = msg.getEncryption().getNonce();
        }
        
        entity.deliveryState = (deliveryState != null && !deliveryState.isEmpty()) ? deliveryState : "QUEUED";
        entity.createdAt = msg.getCreatedAt() > 0 ? msg.getCreatedAt() : System.currentTimeMillis();
        
        dao.insert(entity);
    }

    public void updateDeliveryState(String messageId, String state) {
        updateDeliveryState(messageId, state, System.currentTimeMillis());
    }

    public void updateDeliveryState(String messageId, String state, long timestamp) {
        dao.updateDeliveryState(messageId, state, timestamp);
    }

    public NetworkMessageEntity getMessageEntity(String id) {
        return dao.findById(id);
    }

    public NetworkMessage getMessage(String id) {
        NetworkMessageEntity entity = dao.findById(id);
        if (entity == null) return null;

        NetworkMessage.Builder builder = new NetworkMessage.Builder()
                .messageId(entity.messageId)
                .originDeviceId(entity.originDeviceId)
                .destinationDeviceId(entity.destinationDeviceId)
                .messageType(MessageType.valueOf(entity.messageType))
                .payloadHash(entity.payloadHash)
                .payload(entity.payload);
                
        if (entity.encryptionAlgorithm != null) {
            builder.encryption(new NetworkMessage.EncryptionMetadata(
                entity.encryptionAlgorithm,
                entity.encryptionKeyId,
                entity.encryptionNonce
            ));
        }
        
        return builder.build();
    }

    public java.util.List<String> getRecentMessageIds() {
        return dao != null ? dao.getRecentMessageIds() : java.util.Collections.emptyList();
    }

    public java.util.List<NetworkMessageEntity> getSyncableMessages(String peerId) {
        return dao != null ? dao.getSyncableMessagesForPeer(peerId) : java.util.Collections.emptyList();
    }

    public java.util.List<NetworkMessageEntity> getMessagesSince(long timestamp) {
        return dao != null ? dao.getMessagesSince(timestamp) : java.util.Collections.emptyList();
    }
}
