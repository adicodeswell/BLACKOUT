import type { Result } from "../../contracts/common/Result";
import type {
  MessageDto,
  DeliveryHandle,
  DeliveryStatus,
} from "../../contracts/network/MessageDto";
import type { PeerDto } from "../../contracts/network/PeerDto";
import type { NetworkEvent } from "../../contracts/network/NetworkEvents";
import type { NetworkEngine } from "../../contracts/network/NetworkEngine";

export class NetworkEngineAdapter implements NetworkEngine {
  constructor(
    private readonly engine: NetworkEngine
  ) {}

  start(): Promise<Result<void>> {
    return this.engine.start();
  }

  stop(): Promise<Result<void>> {
    return this.engine.stop();
  }

  discoverPeers(): Promise<Result<PeerDto[]>> {
    return this.engine.discoverPeers();
  }

  getPeers(): Promise<Result<PeerDto[]>> {
    return this.engine.getPeers();
  }

  connect(peerId: string): Promise<Result<void>> {
    return this.engine.connect(peerId);
  }

  disconnect(peerId: string): Promise<Result<void>> {
    return this.engine.disconnect(peerId);
  }

  send(message: MessageDto): Promise<Result<DeliveryHandle>> {
    return this.engine.send(message);
  }

  broadcast(message: MessageDto): Promise<Result<DeliveryHandle>> {
    return this.engine.broadcast(message);
  }

  getDeliveryStatus(
    messageId: string
  ): Promise<Result<DeliveryStatus>> {
    return this.engine.getDeliveryStatus(messageId);
  }

  subscribe(
    listener: (event: NetworkEvent) => void
  ): () => void {
    return this.engine.subscribe(listener);
  }
}