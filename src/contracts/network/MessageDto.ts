export interface MessageDto {
  protocol_version: number;
  message_id: string;
  origin_device_id: string;
  message_type: string;
  created_at: number;
  ttl: number;
  hop_count: number;
  priority: string;
  payload_hash: string;
  payload: any;
  signature: string;
}
