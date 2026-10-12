export interface ContactDto {
  peer_id: string;
  name: string;
  transport: "BLE" | "WIFI_DIRECT";
  transport_address?: string;
  last_seen_at: number;
  is_favorite?: boolean;
  custom_nickname?: string;
}
