package com.blackout.data.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "emergency_reports")
public class EmergencyReportEntity {
    @PrimaryKey
    @NonNull
    public String reportId;

    public String incidentId;
    public String reporterDeviceId;
    public String category;
    public String description;
    
    // Store LocationDto as JSON string
    public String locationJson;
    
    public long observedAt;
    public long createdAt;
    public String severity;
    public String verificationState;
    
    // Converted via RoomConverters
    public java.util.List<String> evidenceIds;
}
