import type { UUID } from "node:crypto";

export type PatkaMessage = {
  readonly message: string;
  readonly id: UUID;
};
