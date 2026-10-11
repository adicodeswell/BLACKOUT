package com.blackout.data.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "contacts")
public class ContactEntity {
    @PrimaryKey
    @NonNull
    public String peerId = "";

    @NonNull
    public String name = "";

    @NonNull
    public String transport = "WIFI_DIRECT";

    public String transportAddress;

    public long lastSeenAt;

    public boolean isFavorite = false;

    public String customNickname;

    public ContactEntity() {}

    @androidx.room.Ignore
    public ContactEntity(@NonNull String peerId, @NonNull String name, @NonNull String transport, String transportAddress, long lastSeenAt) {
        this.peerId = peerId;
        this.name = name;
        this.transport = transport;
        this.transportAddress = transportAddress;
        this.lastSeenAt = lastSeenAt;
    }
}
