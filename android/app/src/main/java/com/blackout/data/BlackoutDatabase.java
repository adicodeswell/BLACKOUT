package com.blackout.data;

import androidx.room.Database;
import androidx.room.RoomDatabase;
import androidx.room.TypeConverters;

import com.blackout.data.converters.RoomConverters;
import com.blackout.data.entity.EmergencyReportEntity;
import com.blackout.data.entity.EvidenceEntity;
import com.blackout.data.entity.IncidentEntity;
import com.blackout.data.entity.NetworkMessageEntity;
import com.blackout.data.entity.ResourceEntity;

@Database(
    entities = {
        NetworkMessageEntity.class,
        EmergencyReportEntity.class,
        IncidentEntity.class,
        EvidenceEntity.class,
        ResourceEntity.class
    },
    version = 1,
    exportSchema = false
)
@TypeConverters({RoomConverters.class})
public abstract class BlackoutDatabase extends RoomDatabase {
    // abstract DAOs will go here in Phase 2
}
