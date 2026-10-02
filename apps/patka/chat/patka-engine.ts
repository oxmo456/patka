import {concatMap, EMPTY, type Observable, of, type Subscription} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import {AGENT_NAME} from '../agent/agent-name.token.ts';
import {PatkaContext} from '../context/patka-context.ts';
import type {
  PatkaContextEntry,
  PatkaInferenceClientResponse,
  PatkaUserUtterance,
} from '../context/patka-context-entry.ts';
import type {Disposable} from '../disposable.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import {PatkaChat} from './patka-chat.ts';
import type {PatkaChatEntry} from './patka-chat-entry.ts';

const USER = 'you';

const patkaToolProtocol = new PatkaToolProtocol();

const fromUserUtterance = (patkaUserUtterance: PatkaUserUtterance): Observable<PatkaChatEntry> =>
  of({
    id: patkaUserUtterance.id,
    role: 'user',
    author: USER,
    message: patkaUserUtterance.utterance.content,
    status: 'complete',
  });

const fromInferenceClientResponse = (
  patkaInferenceClientResponse: PatkaInferenceClientResponse,
  author: string,
): Observable<PatkaChatEntry> =>
  patkaToolProtocol.isAPatkaToolInvocation(patkaInferenceClientResponse.content)
    ? EMPTY
    : of({
        id: patkaInferenceClientResponse.id,
        role: 'agent',
        author,
        message: patkaInferenceClientResponse.content,
        status: 'complete',
      });

const toPatkaChatEntry = (
  patkaContextEntry: PatkaContextEntry,
  author: string,
): Observable<PatkaChatEntry> =>
  match(patkaContextEntry)
    .with({type: 'PatkaUserUtterance'}, fromUserUtterance)
    .with({type: 'PatkaInferenceClientResponse'}, (patkaInferenceClientResponse) =>
      fromInferenceClientResponse(patkaInferenceClientResponse, author),
    )
    .with({type: 'PatkaToolCall'}, () => EMPTY)
    .with({type: 'PatkaToolResult'}, () => EMPTY)
    .exhaustive();

@injectable()
export class PatkaEngine implements Disposable {
  private readonly patkaChat = new PatkaChat();
  private readonly pushToChat: Subscription;

  readonly patkaChatEntries: Observable<ReadonlyArray<PatkaChatEntry>> =
    this.patkaChat.patkaChatEntries;

  constructor(@inject(PatkaContext) patkaContext: PatkaContext, @inject(AGENT_NAME) name: string) {
    this.pushToChat = patkaContext.entries
      .pipe(concatMap((patkaContextEntry) => toPatkaChatEntry(patkaContextEntry, name)))
      .subscribe((patkaChatEntry) => this.patkaChat.push(patkaChatEntry));
  }

  dispose(): void {
    this.pushToChat.unsubscribe();
  }
}
