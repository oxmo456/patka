import type { UUID } from "node:crypto";

export type PatkaChatEntryStatus = "pending" | "complete" | "failed";

export type PatkaChatEntryOrigin = "user" | "agent";

export type PatkaChatEntry = {
  readonly id: UUID;
  readonly origin: PatkaChatEntryOrigin;
  readonly author: string;
  readonly message: string;
  readonly status: PatkaChatEntryStatus;
};
