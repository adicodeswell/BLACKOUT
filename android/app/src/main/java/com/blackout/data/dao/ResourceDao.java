package com.blackout.data.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.blackout.data.entity.ResourceEntity;

import java.util.List;

@Dao
public interface ResourceDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(ResourceEntity resource);

    @Update
    void update(ResourceEntity resource);

    @Query("SELECT * FROM resources WHERE resourceId = :id")
    ResourceEntity findById(String id);

    @Query("SELECT * FROM resources")
    List<ResourceEntity> findAll();
}
