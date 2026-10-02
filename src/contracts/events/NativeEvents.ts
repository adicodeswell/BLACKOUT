import type { PeerDto } from "../network/PeerDto";
import type { NetworkEvent } from "../network/NetworkEvents";
import type { LocationDto } from "../geo/LocationDto";

export interface PermissionState {
  bluetooth: "GRANTED" | "DENIED" | "UNAVAILABLE";
  nearby_wifi: "GRANTED" | "DENIED" | "UNAVAILABLE";
  location: "GRANTED" | "DENIED" | "UNAVAILABLE";
  camera: "GRANTED" | "DENIED" | "UNAVAILABLE";
  microphone: "GRANTED" | "DENIED" | "UNAVAILABLE";
}

export type NativeBridgeEvent =
  | {
      type: "NETWORK";
      event: NetworkEvent;
    }
  | {
      type: "LOCATION";
      location: LocationDto;
    }
  | {
      type: "PERMISSION_CHANGED";
      state: PermissionState;
    };