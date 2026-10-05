package com.blackout.data.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "incidents")
public class IncidentEntity {
    @PrimaryKey
    @NonNull
    public String incidentId;

    public String category;
    public String title;
    public String summary;
    
    public String locationJson;
    
    public long firstReportedAt;
    public long lastUpdatedAt;
    public String status;
    public String severity;
    public String confidenceLevel;
    
    public int independentSourceCount;
    public int contradictionCount;
    public int evidenceCount;
}
