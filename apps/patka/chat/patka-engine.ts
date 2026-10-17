import {concatMap, EMPTY, type Observable, of, type Subscription, scan} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import type {Disposable} from '../../../packages/disposable/disposable.ts';
import type {Duration} from '../../../packages/duration/duration.ts';
import {none, type Option, some} from '../../../packages/option/option.ts';
import type {
  PatkaContextEntry,
  PatkaInferenceClientResponse,
  PatkaUserNotification,
  PatkaUserUtterance,
} from '../../../packages/patka-context/patka-context-entry.ts';
import type {InferenceUsage} from '../../../packages/patka-inference/inference-usage.ts';
import {PatkaToolProtocol} from '../../../packages/patka-tool/patka-tool-protocol.ts';
import {AGENT_NAME} from '../agent/agent-name.token.ts';
import {PatkaContext} from '../context/patka-context.ts';
import {PatkaChat} from './patka-chat.ts';
import type {PatkaChatEntry} from './patka-chat-entry.ts';
import type {PatkaChatEntryMetadata} from './patka-chat-entry-metadata.ts';

const USER = 'you';

const patkaToolProtocol = new PatkaToolProtocol();

function extractDurationFromRoot(
  patkaContextEntry: PatkaContextEntry,
  patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
): Option<Duration> {
  return match(patkaContextEntry.root)
    .with({type: 'some'}, ({value}): Option<Duration> => {
      const root = patkaContextEntries.find((candidate) => candidate.id === value);

      return root === undefined
        ? none
        : some(patkaContextEntry.performanceTimestamp - root.performanceTimestamp);
    })
    .with({type: 'none'}, (): Option<Duration> => none)
    .exhaustive();
}

function extractTokenUsageFromRoot(
  patkaContextEntry: PatkaContextEntry,
  patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
): Option<InferenceUsage> {
  return match(patkaContextEntry.root)
    .with(
      {type: 'some'},
      ({value}): Option<InferenceUsage> =>
        some(
          patkaContextEntries
            .flatMap((candidate) =>
              candidate.type === 'PatkaInferenceClientResponse' &&
              candidate.root.type === 'some' &&
              candidate.root.value === value
                ? [candidate.usage]
                : [],
            )
            .reduce(
              (total: InferenceUsage, usage: InferenceUsage): InferenceUsage => ({
                inputTokens: total.inputTokens + usage.inputTokens,
                outputTokens: total.outputTokens + usage.outputTokens,
              }),
              {inputTokens: 0, outputTokens: 0},
            ),
        ),
    )
    .with({type: 'none'}, (): Option<InferenceUsage> => none)
    .exhaustive();
}

function createMetadataFromRoot(
  patkaContextEntry: PatkaContextEntry,
  patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
): PatkaChatEntryMetadata {
  return {
    ...match(extractDurationFromRoot(patkaContextEntry, patkaContextEntries))
      .with(
        {type: 'some'},
        ({value}): PatkaChatEntryMetadata => ({
          duration: `${Math.round(value)} ms`,
        }),
      )
      .with({type: 'none'}, (): PatkaChatEntryMetadata => ({}))
      .exhaustive(),
    ...match(extractTokenUsageFromRoot(patkaContextEntry, patkaContextEntries))
      .with(
        {type: 'some'},
        ({value}): PatkaChatEntryMetadata => ({
          'input tokens': `${value.inputTokens}`,
          'output tokens': `${value.outputTokens}`,
        }),
      )
      .with({type: 'none'}, (): PatkaChatEntryMetadata => ({}))
      .exhaustive(),
  };
}

function createChatEntryFromUserUtterance(
  patkaUserUtterance: PatkaUserUtterance,
): Observable<PatkaChatEntry> {
  return of({
    id: patkaUserUtterance.id,
    role: 'user',
    author: USER,
    message: patkaUserUtterance.utterance.content,
    status: 'complete',
    metadata: {},
  });
}

function createChatEntryFromInferenceClientResponse(
  patkaInferenceClientResponse: PatkaInferenceClientResponse,
  patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
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
        metadata: createMetadataFromRoot(patkaInferenceClientResponse, patkaContextEntries),
      });
}

function createChatEntryFromUserNotification(
  patkaUserNotification: PatkaUserNotification,
  patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
  author: string,
): Observable<PatkaChatEntry> {
  return of({
    id: patkaUserNotification.id,
    role: 'agent',
    author,
    message: patkaUserNotification.content,
    status: 'complete',
    metadata: createMetadataFromRoot(patkaUserNotification, patkaContextEntries),
  });
}

function createChatEntryFromContextEntries(
  patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
  author: string,
): Observable<PatkaChatEntry> {
  return match(patkaContextEntries[patkaContextEntries.length - 1])
    .with({type: 'PatkaUserUtterance'}, createChatEntryFromUserUtterance)
    .with({type: 'PatkaInferenceClientResponse'}, (patkaInferenceClientResponse) =>
      createChatEntryFromInferenceClientResponse(
        patkaInferenceClientResponse,
        patkaContextEntries,
        author,
      ),
    )
    .with({type: 'PatkaToolCall'}, () => EMPTY)
    .with({type: 'PatkaToolOutput'}, () => EMPTY)
    .with({type: 'PatkaAgentUtterance'}, () => EMPTY)
    .with({type: 'PatkaUserNotification'}, (patkaUserNotification) =>
      createChatEntryFromUserNotification(patkaUserNotification, patkaContextEntries, author),
    )
    .with({type: 'PatkaError'}, () => EMPTY)
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
        scan(
          (accumulator: ReadonlyArray<PatkaContextEntry>, patkaContextEntry: PatkaContextEntry) => [
            ...accumulator,
            patkaContextEntry,
          ],
          [],
        ),
        concatMap((patkaContextEntries) =>
          createChatEntryFromContextEntries(patkaContextEntries, name),
        ),
      )
      .subscribe((patkaChatEntry) => this.patkaChat.push(patkaChatEntry));
  }

  dispose(): void {
    this.pushToChat.unsubscribe();
  }
}
