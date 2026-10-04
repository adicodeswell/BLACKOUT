package com.blackout.network.peer;

public enum ConnectionState {
    NEW,
    CONNECTING,
    CONNECTED,
    HANDSHAKING,
    READY,
    CLOSING,
    CLOSED,
    FAILED
}
