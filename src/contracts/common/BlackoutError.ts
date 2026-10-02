import type { BlackoutErrorCode } from "../errors/ErrorCode";

export type BlackoutModule =
  | "NETWORK"
  | "DATA"
  | "GEO"
  | "AI"
  | "APP"
  | "SYNC";

export interface BlackoutError {
  code: BlackoutErrorCode;
  message: string;
  retryable: boolean;
  module: BlackoutModule;
  details?: Record<string, unknown>;
}