import type { UUID } from "node:crypto";
import type { PatkaPrompt } from "./patka-prompt.ts";

export type PatkaUIPrompt = {
  readonly content: string;
  readonly timestamp: Date;
  readonly id: UUID;
};

export const toPatkaPrompt = (uiPrompt: PatkaUIPrompt): PatkaPrompt => ({
  content: uiPrompt.content,
  timestamp: uiPrompt.timestamp,
  id: uiPrompt.id,
});
