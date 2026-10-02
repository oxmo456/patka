import type {Observable, Subscription} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import {AGENT_NAME} from '../agent/agent-name.token.ts';
import {PatkaContext} from '../context/patka-context.ts';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import type {Disposable} from '../disposable.ts';
import {PatkaChat} from './patka-chat.ts';
import type {PatkaChatEntry, PatkaChatEntryKind} from './patka-chat-entry.ts';

const USER = 'you';

const toPatkaChatEntryKind = (patkaContextEntry: PatkaContextEntry): PatkaChatEntryKind =>
  match(patkaContextEntry.type)
    .with('PatkaToolCall', 'PatkaToolResult', (): PatkaChatEntryKind => 'tool')
    .otherwise((): PatkaChatEntryKind => 'utterance');

const toPatkaChatEntry = (
  patkaContextEntry: PatkaContextEntry,
  author: string,
): PatkaChatEntry => ({
  id: patkaContextEntry.id,
  role: patkaContextEntry.type === 'PatkaUserUtterance' ? 'user' : 'agent',
  kind: toPatkaChatEntryKind(patkaContextEntry),
  author: patkaContextEntry.type === 'PatkaUserUtterance' ? USER : author,
  message: match(patkaContextEntry)
    .with({type: 'PatkaUserUtterance'}, ({utterance}) => utterance.content)
    .with({type: 'PatkaInferenceClientResponse'}, ({content}) => content)
    .with({type: 'PatkaToolCall'}, ({name}) => name)
    .with({type: 'PatkaToolResult'}, ({name}) => `${name} done`)
    .exhaustive(),
  status: 'complete',
});

@injectable()
export class PatkaEngine implements Disposable {
  private readonly patkaChat = new PatkaChat();
  private readonly pushToChat: Subscription;

  readonly patkaChatEntries: Observable<ReadonlyArray<PatkaChatEntry>> =
    this.patkaChat.patkaChatEntries;

  constructor(@inject(PatkaContext) patkaContext: PatkaContext, @inject(AGENT_NAME) name: string) {
    this.pushToChat = patkaContext.entries.subscribe(
      (patkaContextEntry: PatkaContextEntry): void => {
        this.patkaChat.push(toPatkaChatEntry(patkaContextEntry, name));
      },
    );
  }

  dispose(): void {
    this.pushToChat.unsubscribe();
  }
}
