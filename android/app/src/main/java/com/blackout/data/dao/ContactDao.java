package com.blackout.data.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.blackout.data.entity.ContactEntity;

import java.util.List;

@Dao
public interface ContactDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertOrUpdate(ContactEntity contact);

    @Query("SELECT * FROM contacts WHERE peerId = :peerId")
    ContactEntity findById(String peerId);

    @Query("SELECT * FROM contacts ORDER BY lastSeenAt DESC")
    List<ContactEntity> getAllContacts();

    @Query("SELECT * FROM contacts WHERE name LIKE '%' || :query || '%' OR peerId LIKE '%' || :query || '%' OR customNickname LIKE '%' || :query || '%' ORDER BY lastSeenAt DESC")
    List<ContactEntity> searchContacts(String query);

    @Query("DELETE FROM contacts WHERE peerId = :peerId")
    void delete(String peerId);
}
