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
    public void updateDeliveryState(String id, String state, long time) {
        NetworkMessageEntity e = store.get(id);
        if (e != null) {
            e.deliveryState = state;
            e.deliveredAt = time;
        }
    }
}
