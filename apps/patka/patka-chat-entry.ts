import type { UUID } from "node:crypto";

export type PatkaChatEntryStatus = "pending" | "complete" | "failed";

export type PatkaChatEntry = {
  readonly id: UUID;
  readonly author: string;
  readonly message: string;
  readonly status: PatkaChatEntryStatus;
};
