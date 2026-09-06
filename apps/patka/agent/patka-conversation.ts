import type { UUID } from "node:crypto";
import type { Option } from "../option.ts";
import type { PatkaRole } from "../patka-role.ts";
import type { PatkaUtterance } from "../patka-utterance.ts";

export type PatkaConversationEntry = {
  readonly id: UUID;
  readonly role: PatkaRole;
  readonly utterance: Option<PatkaUtterance>;
};

export type PatkaConversation = ReadonlyArray<PatkaConversationEntry>;
