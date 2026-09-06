import type { UUID } from "node:crypto";
import type { PatkaPrompt } from "./patka-prompt.ts";

export type PatkaTurnStatus = "pending" | "answered" | "failed";

export type PatkaTurn = {
  readonly id: UUID;
  readonly prompt: PatkaPrompt;
  readonly status: PatkaTurnStatus;
  readonly response: string | undefined;
};
