import type {PatkaConversation} from './patka-conversation.ts';

export interface PatkaPromptFactory {
  create(patkaConversation: PatkaConversation): string;
}
