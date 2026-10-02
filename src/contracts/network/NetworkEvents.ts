import type { MessageDto, DeliveryStatus } from "./MessageDto";
import type { PeerDto } from "./PeerDto";

export type NetworkEvent =
  | {
      type: "PEER_DISCOVERED";
      peer: PeerDto;
    }
  | {
      type: "PEER_CONNECTED";
      peer: PeerDto;
    }
  | {
      type: "PEER_DISCONNECTED";
      peer_id: string;
    }
  | {
      type: "MESSAGE_RECEIVED";
      message: MessageDto;
    }
  | {
      type: "MESSAGE_DELIVERY_UPDATED";
      status: DeliveryStatus;
    };