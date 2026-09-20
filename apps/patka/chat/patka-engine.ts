import type {Observable} from 'rxjs';
import {Subscription} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import {AGENT_NAME} from '../agent/agent-name.token.ts';
import {PatkaContext} from '../context/patka-context.ts';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import type {Disposable} from '../disposable.ts';
import {PatkaChat} from './patka-chat.ts';
import type {PatkaChatEntry} from './patka-chat-entry.ts';

const USER = 'you';

const toPatkaChatEntry = (
  patkaContextEntry: PatkaContextEntry,
  author: string,
): PatkaChatEntry => ({
  id: patkaContextEntry.id,
  role: patkaContextEntry.type === 'PatkaUserUtterance' ? 'user' : 'agent',
  author: patkaContextEntry.type === 'PatkaUserUtterance' ? USER : author,
  message: match(patkaContextEntry)
    .with({type: 'PatkaUserUtterance'}, ({utterance}) => utterance.content)
    .with({type: 'PatkaReply'}, ({content}) => content)
    .with({type: 'PatkaToolCall'}, ({name, input}) => `using ${name}(${JSON.stringify(input)})…`)
    .with({type: 'PatkaToolResult'}, ({name, output}) => `${name} gave ${JSON.stringify(output)}`)
    .exhaustive(),
  status: 'complete',
});

@injectable()
export class PatkaEngine implements Disposable {
  private readonly patkaChat = new PatkaChat();
  private readonly subscription = new Subscription();

  readonly patkaChatEntries: Observable<ReadonlyArray<PatkaChatEntry>> =
    this.patkaChat.patkaChatEntries;

  constructor(@inject(PatkaContext) patkaContext: PatkaContext, @inject(AGENT_NAME) name: string) {
    this.subscription.add(
      patkaContext.entries.subscribe((patkaContextEntry: PatkaContextEntry): void => {
        this.patkaChat.push(toPatkaChatEntry(patkaContextEntry, name));
      }),
    );
  }

  dispose(): void {
    this.subscription.unsubscribe();
  }
}
