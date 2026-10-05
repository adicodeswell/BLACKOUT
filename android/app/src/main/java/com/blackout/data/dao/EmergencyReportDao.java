package com.blackout.data.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.blackout.data.entity.EmergencyReportEntity;

import java.util.List;

@Dao
public interface EmergencyReportDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(EmergencyReportEntity report);

    @Query("SELECT * FROM emergency_reports WHERE reportId = :id")
    EmergencyReportEntity findById(String id);

    @Query("SELECT * FROM emergency_reports WHERE incidentId = :incidentId")
    List<EmergencyReportEntity> findByIncidentId(String incidentId);
}
