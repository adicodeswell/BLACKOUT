package com.blackout.data;

import android.content.Context;
import androidx.room.Room;

import com.blackout.data.repository.MessageRepository;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.protocol.MessageType;

/**
 * Pure-Java DATA engine facade.
 * Orchestrates repositories and enforces architectural rules.
 */
public class RoomDataEngine {

    private final BlackoutDatabase database;
    private final MessageRepository messageRepository;

    public RoomDataEngine(Context context) {
        this.database = Room.databaseBuilder(
                context.getApplicationContext(),
                BlackoutDatabase.class,
                "blackout_database"
        ).build();
        
        this.messageRepository = new MessageRepository(database.networkMessageDao());
    }
    
    // For testing injection
    public RoomDataEngine(BlackoutDatabase db, MessageRepository msgRepo) {
        this.database = db;
        this.messageRepository = msgRepo;
    }

    public void saveMessage(NetworkMessage message) {
        // Enforce Architectural Rule: DIRECT messages MUST have encryption
        if (message.getMessageType() == MessageType.DIRECT && message.getEncryption() == null) {
            throw new IllegalArgumentException("DIRECT messages must be encrypted before saving.");
        }
        
        messageRepository.saveMessage(message);
        
        // In future phases: 
        // if (message.getMessageType() == MessageType.REPORT) {
        //     reportRepository.processReportMessage(message);
        // }
    }

    public NetworkMessage getMessage(String messageId) {
        return messageRepository.getMessage(messageId);
    }
}
