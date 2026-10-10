import type { Result } from "../../contracts/common/Result";
import type { MessageDto, DeliveryHandle } from "../../contracts/network/MessageDto";
import type { PeerDto } from "../../contracts/network/PeerDto";
import type { LocationDto } from "../../contracts/geo/LocationDto";
import type {
  NativeBridgeEvent,
  PermissionState,
} from "../../contracts/events/NativeEvents";

export interface BlackoutNativeBridge {
  pingNative(): Promise<Result<{ status: string; native: boolean }>>;

  initialize(): Promise<Result<string>>;
  startNetworking(): Promise<Result<void>>;
  stopNetworking(): Promise<Result<void>>;

  getPeers(): Promise<Result<PeerDto[]>>;
  sendMessage(
    message: MessageDto
  ): Promise<Result<DeliveryHandle>>;

  getCurrentLocation(): Promise<Result<LocationDto>>;

  requestRequiredPermissions(): Promise<Result<PermissionState>>;

  subscribe(
    listener: (event: NativeBridgeEvent) => void
  ): () => void;
}