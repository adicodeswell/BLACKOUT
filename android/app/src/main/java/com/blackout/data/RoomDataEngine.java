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

    public NetworkMessage getMessage(String messageId) {
        return messageRepository.getMessage(messageId);
    }

    public List<NetworkMessageEntity> getPendingOutbound() {
        return database.networkMessageDao().findPendingOutbound();
    }

    public List<NetworkMessageEntity> getAllMessages() {
        return database.networkMessageDao().getAllMessages();
    }

    public void markDelivered(String messageId, long deliveredAt) {
        database.networkMessageDao().updateDeliveryState(messageId, "DELIVERED", deliveredAt);
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
}
