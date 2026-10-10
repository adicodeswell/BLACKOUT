package com.blackout.data.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.blackout.data.entity.NetworkMessageEntity;

import java.util.List;

@Dao
public interface NetworkMessageDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(NetworkMessageEntity message);

    @Query("SELECT * FROM network_messages WHERE messageId = :id")
    NetworkMessageEntity findById(String id);

    @Query("SELECT * FROM network_messages ORDER BY createdAt ASC")
    List<NetworkMessageEntity> getAllMessages();

    @Query("SELECT * FROM network_messages WHERE deliveryState = 'QUEUED' ORDER BY createdAt ASC")
    List<NetworkMessageEntity> findPendingOutbound();

    @Query("UPDATE network_messages SET deliveryState = :state, deliveredAt = :time WHERE messageId = :id")
    void updateDeliveryState(String id, String state, long time);
}
