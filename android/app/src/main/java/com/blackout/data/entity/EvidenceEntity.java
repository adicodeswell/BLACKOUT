package com.blackout.data.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "evidence")
public class EvidenceEntity {
    @PrimaryKey
    @NonNull
    public String evidenceId;

    public String incidentId;
    public String reportId;
    public String type;
    public String localUri;
    public String contentHash;
    public long capturedAt;
    public String locationJson;
    public String sourceDeviceId;
    public String analysisState;
}
