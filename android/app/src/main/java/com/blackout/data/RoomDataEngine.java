package com.blackout.data;

import android.content.Context;
import androidx.room.Room;

import com.blackout.data.repository.MessageRepository;
import com.blackout.data.repository.IncidentRepository;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.protocol.MessageType;
import com.blackout.data.migrations.DatabaseMigrations;
import com.blackout.data.entity.*;

import java.util.List;

public class RoomDataEngine {

    private final BlackoutDatabase database;
    private final MessageRepository messageRepository;
    private final IncidentRepository incidentRepository;

    public RoomDataEngine(Context context) {
        this.database = Room.databaseBuilder(
                context.getApplicationContext(),
                BlackoutDatabase.class,
                "blackout_database"
        )
        .addMigrations(DatabaseMigrations.ALL_MIGRATIONS)
        .build();
        
        this.messageRepository = new MessageRepository(database.networkMessageDao());
        this.incidentRepository = new IncidentRepository(database.incidentDao(), database.emergencyReportDao());
    }
    
    public RoomDataEngine(BlackoutDatabase db, MessageRepository msgRepo) {
        this.database = db;
        this.messageRepository = msgRepo;
        if(db != null) { this.incidentRepository = new IncidentRepository(db.incidentDao(), db.emergencyReportDao()); } else { this.incidentRepository = null; }
    }

    public void saveMessage(NetworkMessage message) {
        messageRepository.saveMessage(message);
    }

    public void saveMessage(NetworkMessage message, String deliveryState) {
        messageRepository.saveMessage(message, deliveryState);
    }

    public NetworkMessage getMessage(String messageId) {
        return messageRepository.getMessage(messageId);
    }

    public NetworkMessageEntity getMessageEntity(String messageId) {
        if (database != null) {
            return database.networkMessageDao().findById(messageId);
        } else if (messageRepository != null) {
            return messageRepository.getMessageEntity(messageId);
        }
        return null;
    }

    public List<NetworkMessageEntity> getPendingOutbound() {
        return database != null ? database.networkMessageDao().findPendingOutbound() : java.util.Collections.emptyList();
    }

    public List<NetworkMessageEntity> getAllMessages() {
        return database != null ? database.networkMessageDao().getAllMessages() : java.util.Collections.emptyList();
    }

    public List<String> getRecentMessageIds() {
        if (database != null) {
            return database.networkMessageDao().getRecentMessageIds();
        } else if (messageRepository != null) {
            return messageRepository.getRecentMessageIds();
        }
        return java.util.Collections.emptyList();
    }

    public List<NetworkMessageEntity> getSyncableMessages(String peerId) {
        if (database != null) {
            return database.networkMessageDao().getSyncableMessagesForPeer(peerId);
        } else if (messageRepository != null) {
            return messageRepository.getSyncableMessages(peerId);
        }
        return java.util.Collections.emptyList();
    }

    public List<NetworkMessageEntity> getMessagesSince(long timestamp) {
        if (database != null) {
            return database.networkMessageDao().getMessagesSince(timestamp);
        } else if (messageRepository != null) {
            return messageRepository.getMessagesSince(timestamp);
        }
        return java.util.Collections.emptyList();
    }

    public void updateDeliveryState(String messageId, String state) {
        if (database != null) {
            database.networkMessageDao().updateDeliveryState(messageId, state, System.currentTimeMillis());
        } else if (messageRepository != null) {
            messageRepository.updateDeliveryState(messageId, state);
        }
    }

    public void markDelivered(String messageId, long deliveredAt) {
        if (database != null) {
            database.networkMessageDao().updateDeliveryState(messageId, "DELIVERED", deliveredAt);
        } else if (messageRepository != null) {
            messageRepository.updateDeliveryState(messageId, "DELIVERED", deliveredAt);
        }
    }

    public void processReport(EmergencyReportEntity report) {
        incidentRepository.processReport(report);
    }

    public IncidentEntity getIncident(String incidentId) {
        return database.incidentDao().findById(incidentId);
    }

    public List<IncidentEntity> listIncidents() {
        return database.incidentDao().findAll();
    }

    public void createResource(ResourceEntity resource) {
        database.resourceDao().insert(resource);
    }

    public List<ResourceEntity> listResources() {
        return database.resourceDao().findAll();
    }

    
    public void updateIncident(IncidentEntity incident) {
        database.incidentDao().update(incident);
    }
    
    public List<EvidenceEntity> getEvidenceForIncident(String incidentId) {
        return database.evidenceDao().findByIncidentId(incidentId);
    }
    
    public ResourceEntity getResource(String resourceId) {
        return database.resourceDao().findById(resourceId);
    }
    
    public void updateResource(ResourceEntity resource) {
        database.resourceDao().update(resource);
    }

    public void addEvidence(EvidenceEntity evidence) {
        database.evidenceDao().insert(evidence);
    }

    public void saveContact(ContactEntity contact) {
        if (database != null) {
            database.contactDao().insertOrUpdate(contact);
        }
    }

    public ContactEntity getContact(String peerId) {
        return database != null ? database.contactDao().findById(peerId) : null;
    }

    public List<ContactEntity> getAllContacts() {
        return database != null ? database.contactDao().getAllContacts() : java.util.Collections.emptyList();
    }

    public List<ContactEntity> searchContacts(String query) {
        return database != null ? database.contactDao().searchContacts(query) : java.util.Collections.emptyList();
    }

    public void deleteContact(String peerId) {
        if (database != null) {
            database.contactDao().delete(peerId);
        }
    }
}
