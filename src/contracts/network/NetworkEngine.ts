import type { Result } from "../common/Result";
import type { MessageDto, DeliveryHandle, DeliveryStatus } from "./MessageDto";
import type { PeerDto } from "./PeerDto";
import type { NetworkEvent } from "./NetworkEvents";

export interface NetworkEngine {
  start(): Promise<Result<void>>;
  stop(): Promise<Result<void>>;

  discoverPeers(): Promise<Result<PeerDto[]>>;
  getPeers(): Promise<Result<PeerDto[]>>;
  connect(peerId: string): Promise<Result<void>>;
  disconnect(peerId: string): Promise<Result<void>>;

  send(message: MessageDto): Promise<Result<DeliveryHandle>>;
  broadcast(message: MessageDto): Promise<Result<DeliveryHandle>>;

  getDeliveryStatus(
    messageId: string
  ): Promise<Result<DeliveryStatus>>;

  subscribe(
    listener: (event: NetworkEvent) => void
  ): () => void;
}