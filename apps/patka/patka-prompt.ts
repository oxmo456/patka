import type { UUID } from "node:crypto";

export type PatkaPrompt = {
  readonly content: string;
  readonly timestamp: Date;
  readonly id: UUID;
};
