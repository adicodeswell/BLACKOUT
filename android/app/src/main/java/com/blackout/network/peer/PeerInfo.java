package com.blackout.network.peer;

import java.util.List;

public class PeerInfo {
    private final String peerId;
    private final String transport; // e.g. "WIFI_DIRECT" or "BLE"
    private ConnectionState connectionState;
    private long lastSeenAt;
    private List<String> capabilities;

    public PeerInfo(String peerId, String transport, ConnectionState initialState, List<String> capabilities) {
        this.peerId = peerId;
        this.transport = transport;
        this.connectionState = initialState;
        this.capabilities = capabilities;
        this.lastSeenAt = System.currentTimeMillis();
    }

    public String getPeerId() { return peerId; }
    public String getTransport() { return transport; }
    
    public ConnectionState getConnectionState() { return connectionState; }
    public void setConnectionState(ConnectionState state) { 
        this.connectionState = state;
        updateLastSeen();
    }

    public long getLastSeenAt() { return lastSeenAt; }
    public void updateLastSeen() { this.lastSeenAt = System.currentTimeMillis(); }

    public List<String> getCapabilities() { return capabilities; }
    public void setCapabilities(List<String> capabilities) { this.capabilities = capabilities; }
}
