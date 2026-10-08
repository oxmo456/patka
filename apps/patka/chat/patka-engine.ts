import {concatMap, EMPTY, type Observable, of, type Subscription} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import {AGENT_NAME} from '../agent/agent-name.token.ts';
import {PatkaContext} from '../context/patka-context.ts';
import type {
  PatkaContextEntry,
  PatkaError,
  PatkaInferenceClientResponse,
  PatkaUserNotification,
  PatkaUserUtterance,
} from '../context/patka-context-entry.ts';
import type {Disposable} from '../disposable.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import {PatkaChat} from './patka-chat.ts';
import type {PatkaChatEntry} from './patka-chat-entry.ts';

const USER = 'you';

const ERROR_MESSAGE = 'oops! something went wrong :/';

const patkaToolProtocol = new PatkaToolProtocol();

function createChatEntryFromUserUtterance(
  patkaUserUtterance: PatkaUserUtterance,
): Observable<PatkaChatEntry> {
  return of({
    id: patkaUserUtterance.id,
    role: 'user',
    author: USER,
    message: patkaUserUtterance.utterance.content,
    status: 'complete',
  });
}

function createChatEntryFromInferenceClientResponse(
  patkaInferenceClientResponse: PatkaInferenceClientResponse,
  author: string,
): Observable<PatkaChatEntry> {
  return patkaToolProtocol.isAPatkaToolInvocation(patkaInferenceClientResponse.content)
    ? EMPTY
    : of({
        id: patkaInferenceClientResponse.id,
        role: 'agent',
        author,
        message: patkaInferenceClientResponse.content,
        status: 'complete',
      });
}

function createChatEntryFromUserNotification(
  patkaUserNotification: PatkaUserNotification,
  author: string,
): Observable<PatkaChatEntry> {
  return of({
    id: patkaUserNotification.id,
    role: 'agent',
    author,
    message: patkaUserNotification.content,
    status: 'complete',
  });
}

function createChatEntryFromError(
  patkaError: PatkaError,
  author: string,
): Observable<PatkaChatEntry> {
  return of({
    id: patkaError.id,
    role: 'agent',
    author,
    message: ERROR_MESSAGE,
    status: 'failed',
  });
}

function createChatEntryFromContextEntry(
  patkaContextEntry: PatkaContextEntry,
  author: string,
): Observable<PatkaChatEntry> {
  return match(patkaContextEntry)
    .with({type: 'PatkaUserUtterance'}, createChatEntryFromUserUtterance)
    .with({type: 'PatkaInferenceClientResponse'}, (patkaInferenceClientResponse) =>
      createChatEntryFromInferenceClientResponse(patkaInferenceClientResponse, author),
    )
    .with({type: 'PatkaToolCall'}, () => EMPTY)
    .with({type: 'PatkaToolOutput'}, () => EMPTY)
    .with({type: 'PatkaUserNotification'}, (patkaUserNotification) =>
      createChatEntryFromUserNotification(patkaUserNotification, author),
    )
    .with({type: 'PatkaError'}, (patkaError) => createChatEntryFromError(patkaError, author))
    .exhaustive();
}

@injectable()
export class PatkaEngine implements Disposable {
  private readonly patkaChat = new PatkaChat();
  private readonly pushToChat: Subscription;

  readonly patkaChatEntries: Observable<ReadonlyArray<PatkaChatEntry>> =
    this.patkaChat.patkaChatEntries;

  constructor(@inject(PatkaContext) patkaContext: PatkaContext, @inject(AGENT_NAME) name: string) {
    this.pushToChat = patkaContext.entries
      .pipe(
        concatMap((patkaContextEntry) => createChatEntryFromContextEntry(patkaContextEntry, name)),
      )
      .subscribe((patkaChatEntry) => this.patkaChat.push(patkaChatEntry));
  }

  dispose(): void {
    this.pushToChat.unsubscribe();
  }
}
