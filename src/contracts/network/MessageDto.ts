export type MessageType =
  | "HELLO"
  | "HELLO_ACK"
  | "CAPABILITIES"
  | "CAPABILITIES_ACK"
  | "QUEUE_SUMMARY"
  | "DIRECT"
  | "BROADCAST"
  | "REPORT"
  | "ACK"
  | "RESOURCE"
  | "HAZARD"
  | "SYNC";

export type MessagePriority =
  | "CRITICAL_EMERGENCY"
  | "HIGH"
  | "NORMAL"
  | "LOW";

export interface MessageEncryption {
  algorithm: "AES_GCM";
  key_id: string;
  nonce: string;
}

export interface MessageDto {
  protocol_version: number;
  message_id: string;
  origin_device_id: string;
  destination_device_id?: string;
  message_type: MessageType;
  created_at: number;
  ttl: number;
  hop_count: number;
  priority: MessagePriority;
  payload_hash: string;
  payload: unknown;
  encryption?: MessageEncryption;
  signature: string;
  _local_delivery_state?: DeliveryState;
}

export type DeliveryState =
  | "CREATED"
  | "QUEUED"
  | "SENT"
  | "RECEIVED"
  | "DELIVERED"
  | "RETRYING"
  | "FAILED"
  | "EXPIRED";

export interface DeliveryStatus {
  message_id: string;
  state: DeliveryState;
  updated_at: number;
  attempts: number;
  last_error?: import("../common/BlackoutError").BlackoutError;
}

export interface DeliveryHandle {
  message_id: string;
  accepted_at: number;
}
