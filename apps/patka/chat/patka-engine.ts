import type {Observable} from 'rxjs';
import {match} from 'ts-pattern';
import type {PatkaAgent} from '../agent/patka-agent.ts';
import type {PatkaConversation, PatkaConversationEntry} from '../agent/patka-conversation.ts';
import type {PatkaUtterance} from '../patka-utterance.ts';
import {PatkaChat} from './patka-chat.ts';
import type {PatkaChatEntry, PatkaChatEntryStatus} from './patka-chat-entry.ts';

const USER = 'you';

const toPatkaChatEntry = (
  patkaConversationEntry: PatkaConversationEntry,
  author: string,
): PatkaChatEntry => ({
  id: patkaConversationEntry.id,
  role: patkaConversationEntry.role,
  author: patkaConversationEntry.role === 'user' ? USER : author,
  message: match(patkaConversationEntry.utterance)
    .with({type: 'some'}, (utterance) => utterance.value.content)
    .with({type: 'none'}, () => '')
    .exhaustive(),
  status: match(patkaConversationEntry.utterance)
    .with({type: 'some'}, (): PatkaChatEntryStatus => 'complete')
    .with({type: 'none'}, (): PatkaChatEntryStatus => 'pending')
    .exhaustive(),
});

export class PatkaEngine {
  private readonly patkaChat = new PatkaChat();
  private readonly patkaAgent: PatkaAgent;

  readonly patkaChatEntries: Observable<ReadonlyArray<PatkaChatEntry>> =
    this.patkaChat.patkaChatEntries;

  constructor(patkaAgent: PatkaAgent) {
    this.patkaAgent = patkaAgent;
    patkaAgent.patkaConversation.subscribe((patkaConversation: PatkaConversation): void => {
      for (const patkaConversationEntry of patkaConversation) {
        this.patkaChat.push(toPatkaChatEntry(patkaConversationEntry, patkaAgent.name));
      }
    });
  }

  handle(patkaUtterance: PatkaUtterance): void {
    this.patkaAgent.handle(patkaUtterance);
  }
}
