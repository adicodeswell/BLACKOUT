package com.blackout.network.protocol;

public class NetworkMessage {

    public static class EncryptionMetadata {
        private final String algorithm;
        private final String keyId;
        private final String nonce;

        public EncryptionMetadata(String algorithm, String keyId, String nonce) {
            this.algorithm = algorithm;
            this.keyId = keyId;
            this.nonce = nonce;
        }

        public String getAlgorithm() { return algorithm; }
        public String getKeyId() { return keyId; }
        public String getNonce() { return nonce; }
    }

    private final int protocolVersion;
    private final String messageId;
    private final String originDeviceId;
    private final String destinationDeviceId; // Optional (null for broadcast)
    private final MessageType messageType;
    private final long createdAt;
    private final int ttl;
    private final int hopCount;
    private final String priority; // e.g. "HIGH", "NORMAL"
    private final String payloadHash;
    private final String payload; // Serialized JSON payload string
    private final EncryptionMetadata encryption;
    private final String signature;

    // Builder pattern for immutability
    public static class Builder {
        private int protocolVersion = 1;
        private String messageId;
        private String originDeviceId;
        private String destinationDeviceId = null;
        private MessageType messageType;
        private long createdAt = System.currentTimeMillis();
        private int ttl = 0;
        private boolean isTtlSet = false;
        private int hopCount = 0;
        private String priority = "NORMAL";
        private String payloadHash = "";
        private String payload;
        private EncryptionMetadata encryption = null;
        private String signature = "";

        public Builder() {}

        public Builder protocolVersion(int val) { this.protocolVersion = val; return this; }
        public Builder messageId(String val) { this.messageId = val; return this; }
        public Builder originDeviceId(String val) { this.originDeviceId = val; return this; }
        public Builder destinationDeviceId(String val) { this.destinationDeviceId = val; return this; }
        public Builder messageType(MessageType val) { this.messageType = val; return this; }
        public Builder createdAt(long val) { this.createdAt = val; return this; }
        public Builder ttl(int val) { this.ttl = val; this.isTtlSet = true; return this; }
        public Builder hopCount(int val) { this.hopCount = val; return this; }
        public Builder priority(String val) { this.priority = val; return this; }
        public Builder payloadHash(String val) { this.payloadHash = val; return this; }
        public Builder payload(String val) { this.payload = val; return this; }
        public Builder encryption(EncryptionMetadata val) { this.encryption = val; return this; }
        public Builder signature(String val) { this.signature = val; return this; }

        public NetworkMessage build() {
            if (!isTtlSet) {
                ttl = getDefaultTtlForType(messageType);
            }
            return new NetworkMessage(this);
        }
    }

    public static int getDefaultTtlForType(MessageType type) {
        if (type == null) return 5;
        switch (type) {
            case REPORT:
            case HAZARD:
                return 25; // Maximum local saturation (issue1.md)
            case DIRECT:
            case ACK:
                return 15; // Fast intra-city routing (issue1.md)
            case HELLO:
            case HELLO_ACK:
            case CAPABILITIES:
            case CAPABILITIES_ACK:
            case QUEUE_SUMMARY:
            case SYNC:
                return 2;  // Strictly local neighbor discovery/exchange (issue1.md)
            case RESOURCE:
            case BROADCAST:
                return 20;
            default:
                return 5;
        }
    }

    private NetworkMessage(Builder builder) {
        this.protocolVersion = builder.protocolVersion;
        this.messageId = builder.messageId;
        this.originDeviceId = builder.originDeviceId;
        this.destinationDeviceId = builder.destinationDeviceId;
        this.messageType = builder.messageType;
        this.createdAt = builder.createdAt;
        this.ttl = builder.ttl;
        this.hopCount = builder.hopCount;
        this.priority = builder.priority;
        this.payloadHash = builder.payloadHash;
        this.payload = builder.payload;
        this.encryption = builder.encryption;
        this.signature = builder.signature;
    }

    // Getters
    public int getProtocolVersion() { return protocolVersion; }
    public String getMessageId() { return messageId; }
    public String getOriginDeviceId() { return originDeviceId; }
    public String getDestinationDeviceId() { return destinationDeviceId; }
    public MessageType getMessageType() { return messageType; }
    public long getCreatedAt() { return createdAt; }
    public int getTtl() { return ttl; }
    public int getHopCount() { return hopCount; }
    public String getPriority() { return priority; }
    public String getPayloadHash() { return payloadHash; }
    public String getPayload() { return payload; }
    public EncryptionMetadata getEncryption() { return encryption; }
    public String getSignature() { return signature; }
}
