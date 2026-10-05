package com.blackout.data.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "resources")
public class ResourceEntity {
    @PrimaryKey
    @NonNull
    public String resourceId;

    public String type;
    public String name;
    public String description;
    public String locationJson;
    public String availability;
    
    public int capacity;
    public int remainingCapacity;
    
    public String sourceDeviceId;
    public long createdAt;
    public long updatedAt;
    public long expiresAt;
}
