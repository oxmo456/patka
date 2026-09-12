import type {PatkaConversation} from './patka-conversation.ts';

export interface PatkaPromptFactory {
  create(history: PatkaConversation): string;
}
