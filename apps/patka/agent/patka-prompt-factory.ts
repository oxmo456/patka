import type { PatkaConversation, PatkaConversationEntry } from "./patka-conversation.ts";

export interface PatkaPromptFactory {
  create(history: PatkaConversation): string;
}
