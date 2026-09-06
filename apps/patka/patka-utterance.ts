import type { UUID } from "node:crypto";

export type PatkaUtterance = {
  readonly content: string;
  readonly timestamp: Date;
  readonly id: UUID;
};
