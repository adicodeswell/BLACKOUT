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
        NetworkMessageEntity entity = new NetworkMessageEntity();
        entity.messageId = msg.getMessageId();
        entity.originDeviceId = msg.getOriginDeviceId();
        entity.destinationDeviceId = msg.getDestinationDeviceId();
        entity.messageType = msg.getMessageType().name();
        entity.payloadHash = msg.getPayloadHash();
        entity.payload = msg.getPayload();
        
        if (msg.getEncryption() != null) {
            entity.encryptionAlgorithm = msg.getEncryption().getAlgorithm();
            entity.encryptionKeyId = msg.getEncryption().getKeyId();
            entity.encryptionNonce = msg.getEncryption().getNonce();
        }
        
        entity.deliveryState = "QUEUED";
        entity.createdAt = System.currentTimeMillis();
        
        dao.insert(entity);
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
}
