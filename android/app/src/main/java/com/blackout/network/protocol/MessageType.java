package com.blackout.network.protocol;

public enum MessageType {
    DIRECT,
    REPORT,
    HAZARD,
    RESOURCE,
    ACK,
    HELLO,
    HELLO_ACK,
    CAPABILITIES,
    CAPABILITIES_ACK,
    QUEUE_SUMMARY,
    BROADCAST,
    SYNC
}
