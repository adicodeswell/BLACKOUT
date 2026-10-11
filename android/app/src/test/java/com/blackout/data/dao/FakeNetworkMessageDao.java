package com.blackout.data.dao;

import com.blackout.data.entity.NetworkMessageEntity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FakeNetworkMessageDao implements NetworkMessageDao {
    private final Map<String, NetworkMessageEntity> store = new HashMap<>();

    @Override
    public void insert(NetworkMessageEntity message) {
        store.put(message.messageId, message);
    }

    @Override
    public NetworkMessageEntity findById(String id) {
        return store.get(id);
    }

    @Override
    public List<NetworkMessageEntity> findPendingOutbound() {
        return new ArrayList<>();
    }

    @Override
    public List<NetworkMessageEntity> getAllMessages() {
        return new ArrayList<>(store.values());
    }

    @Override
    public void updateDeliveryState(String id, String state, long time) {
        NetworkMessageEntity e = store.get(id);
        if (e != null) {
            e.deliveryState = state;
            e.deliveredAt = time;
        }
    }

    @Override
    public List<String> getRecentMessageIds() {
        return new ArrayList<>(store.keySet());
    }

    @Override
    public List<NetworkMessageEntity> getSyncableMessagesForPeer(String peerId) {
        List<NetworkMessageEntity> list = new ArrayList<>();
        for (NetworkMessageEntity e : store.values()) {
            if ("REPORT".equals(e.messageType) || "HAZARD".equals(e.messageType) ||
                "RESOURCE".equals(e.messageType) || "BROADCAST".equals(e.messageType) ||
                (peerId != null && peerId.equals(e.destinationDeviceId))) {
                list.add(e);
            }
        }
        return list;
    }

    @Override
    public List<NetworkMessageEntity> getMessagesSince(long timestamp) {
        List<NetworkMessageEntity> list = new ArrayList<>();
        for (NetworkMessageEntity e : store.values()) {
            if (e.createdAt > timestamp) {
                list.add(e);
            }
        }
        return list;
    }
}
