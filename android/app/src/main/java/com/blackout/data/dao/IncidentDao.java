package com.blackout.data.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.blackout.data.entity.IncidentEntity;

import java.util.List;

@Dao
public interface IncidentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(IncidentEntity incident);

    @Update
    void update(IncidentEntity incident);

    @Query("SELECT * FROM incidents WHERE incidentId = :id")
    IncidentEntity findById(String id);

    @Query("SELECT * FROM incidents ORDER BY lastUpdatedAt DESC")
    List<IncidentEntity> findAll();
    @Query("SELECT * FROM incidents WHERE category = :category AND status = :status")
    List<IncidentEntity> findByCategoryAndStatus(String category, String status);
}
