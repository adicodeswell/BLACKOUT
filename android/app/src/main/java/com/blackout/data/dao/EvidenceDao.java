package com.blackout.data.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.blackout.data.entity.EvidenceEntity;

import java.util.List;

@Dao
public interface EvidenceDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(EvidenceEntity evidence);

    @Query("SELECT * FROM evidence WHERE incidentId = :incidentId")
    List<EvidenceEntity> findByIncidentId(String incidentId);
}
