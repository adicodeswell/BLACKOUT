package com.blackout.network.protocol;

public class MessageValidator {

    public static class ValidationException extends Exception {
        public ValidationException(String message) {
            super(message);
        }
    }

    public static void validate(NetworkMessage message) throws ValidationException {
        if (message == null) {
            throw new ValidationException("Message cannot be null");
        }
        
        if (message.getProtocolVersion() <= 0) {
            throw new ValidationException("Invalid protocol version: " + message.getProtocolVersion());
        }

        if (message.getMessageId() == null || message.getMessageId().trim().isEmpty()) {
            throw new ValidationException("Message ID is required");
        }

        if (message.getOriginDeviceId() == null || message.getOriginDeviceId().trim().isEmpty()) {
            throw new ValidationException("Origin device ID is required");
        }

        if (message.getMessageType() == null) {
            throw new ValidationException("Message type is required");
        }

        if (message.getCreatedAt() <= 0) {
            throw new ValidationException("Invalid creation timestamp");
        }

        if (message.getTtl() < 0) {
            throw new ValidationException("TTL cannot be negative");
        }

        if (message.getHopCount() < 0) {
            throw new ValidationException("Hop count cannot be negative");
        }

        if (message.getPayloadHash() == null || message.getPayloadHash().trim().isEmpty()) {
            throw new ValidationException("Payload hash is required");
        }

        if (message.getPayload() == null) {
            throw new ValidationException("Payload is required (can be empty string, but not null)");
        }

        // --- DIRECT message specific validation ---
        if (message.getMessageType() == MessageType.DIRECT) {
            if (message.getDestinationDeviceId() == null || message.getDestinationDeviceId().trim().isEmpty()) {
                throw new ValidationException("DIRECT message must have a destination_device_id");
            }
            if (message.getEncryption() == null) {
                throw new ValidationException("DIRECT message must include encryption metadata");
            }
            if (message.getEncryption().getAlgorithm() == null || message.getEncryption().getAlgorithm().trim().isEmpty()) {
                throw new ValidationException("Encryption algorithm is required for DIRECT messages");
            }
        }
    }
}
