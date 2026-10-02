import type { BlackoutError } from "./BlackoutError";

export type Result<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: BlackoutError;
    };