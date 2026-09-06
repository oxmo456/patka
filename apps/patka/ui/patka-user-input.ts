import type { UUID } from "node:crypto";
import type { PatkaUtterance } from "../patka-utterance.ts";

export type PatkaUserInput = {
  readonly content: string;
  readonly timestamp: Date;
  readonly id: UUID;
};

export const toPatkaUtterance = (userInput: PatkaUserInput): PatkaUtterance => ({
  content: userInput.content,
  timestamp: userInput.timestamp,
  id: userInput.id,
});
