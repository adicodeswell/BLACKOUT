export type PeerTransport = "BLE" | "WIFI_DIRECT";

export type PeerConnectionState =
  | "DISCOVERED"
  | "CONNECTING"
  | "HANDSHAKING"
  | "CONNECTED"
  | "LOST";

export interface PeerDto {
  peer_id: string;
  transport: PeerTransport;
  connection_state: PeerConnectionState;
  last_seen_at: number;
  capabilities: string[];
}