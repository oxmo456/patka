import {randomUUID} from 'node:crypto';
import {
  catchError,
  concat,
  concatMap,
  defaultIfEmpty,
  EMPTY,
  map,
  type Observable,
  of,
  scan,
} from 'rxjs';
import {match} from 'ts-pattern';
import {type Option, some} from '../option/option.ts';
import type {
  PatkaContextEntry,
  PatkaError,
  PatkaInferenceClientRequest,
  PatkaInferenceClientResponse,
  PatkaToolCall,
  PatkaToolEmptyOutput,
  PatkaToolInvocationError,
  PatkaUserNotification,
} from '../patka-context/patka-context-entry.ts';
import type {PatkaContextEntryID} from '../patka-context/patka-context-entry-id.ts';
import type {InferenceClient} from '../patka-inference/inference-client.ts';
import type {InferenceClientChatInputFactory} from '../patka-prompt/inference-client-chat-input-factory.ts';
import type {PatkaTools} from '../patka-tool/patka-tools.ts';
import {REPORT_INCOMPETENCY} from '../patka-tool/report-incompetency.ts';
import {createPerformanceTimestamp} from '../performance-timestamp/performance-timestamp.ts';
import {createTimestamp} from '../timestamp/timestamp.ts';
import type {PatkaAgentText} from './patka-agent-text.ts';

function createRootFromParent(parent: PatkaContextEntry): Option<PatkaContextEntryID> {
  return parent.root.type === 'some' ? parent.root : some(parent.id);
}

export class PatkaAgent {
  private readonly patkaTools: PatkaTools;
  private readonly inferenceClientChatInputFactory: InferenceClientChatInputFactory;
  private readonly inferenceClient: InferenceClient;
  private readonly patkaAgentText: PatkaAgentText;

  readonly name: string;
  readonly output: Observable<PatkaContextEntry>;

  constructor(
    name: string,
    patkaTools: PatkaTools,
    inferenceClient: InferenceClient,
    input: Observable<PatkaContextEntry>,
    inferenceClientChatInputFactory: InferenceClientChatInputFactory,
    patkaAgentText: PatkaAgentText,
  ) {
    this.name = name;
    this.patkaTools = patkaTools;
    this.inferenceClient = inferenceClient;
    this.inferenceClientChatInputFactory = inferenceClientChatInputFactory;
    this.patkaAgentText = patkaAgentText;
    this.output = input.pipe(
      scan(
        (accumulator: ReadonlyArray<PatkaContextEntry>, patkaContextEntry: PatkaContextEntry) => [
          ...accumulator,
          patkaContextEntry,
        ],
        [],
      ),
      concatMap((patkaContextEntries) => this.process(patkaContextEntries)),
    );
  }

  private process(
    patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
  ): Observable<PatkaContextEntry> {
    const lastPatkaContextEntry = patkaContextEntries[patkaContextEntries.length - 1];

    return match(lastPatkaContextEntry)
      .with({type: 'PatkaUserUtterance'}, () =>
        this.generate(patkaContextEntries, lastPatkaContextEntry),
      )
      .with({type: 'PatkaToolEmptyOutput', name: REPORT_INCOMPETENCY}, () =>
        this.notifyMissingTools(lastPatkaContextEntry),
      )
      .with({type: 'PatkaToolOutput'}, () =>
        this.generate(patkaContextEntries, lastPatkaContextEntry),
      )
      .with({type: 'PatkaToolEmptyOutput'}, () =>
        this.generate(patkaContextEntries, lastPatkaContextEntry),
      )
      .with({type: 'PatkaToolInvocationError'}, () =>
        this.generate(patkaContextEntries, lastPatkaContextEntry),
      )
      .with({type: 'PatkaInferenceClientRequest'}, () => EMPTY)
      .with({type: 'PatkaInferenceClientResponse'}, (patkaInferenceClientResponse) =>
        this.processInferenceClientResponse(patkaInferenceClientResponse),
      )
      .with({type: 'PatkaToolCall'}, (patkaToolCall) => this.useTool(patkaToolCall))
      .with({type: 'PatkaUserNotification'}, () => EMPTY)
      .with({type: 'PatkaError'}, (patkaError) => this.notifyError(patkaError))
      .exhaustive();
  }

  private notifyMissingTools(parent: PatkaContextEntry): Observable<PatkaContextEntry> {
    return of({
      type: 'PatkaUserNotification',
      id: randomUUID(),
      timestamp: createTimestamp(),
      performanceTimestamp: createPerformanceTimestamp(),
      root: createRootFromParent(parent),
      parent: some(parent.id),
      content: this.patkaAgentText.missingTools,
    } satisfies PatkaUserNotification);
  }

  private notifyError(patkaError: PatkaError): Observable<PatkaContextEntry> {
    return of({
      type: 'PatkaUserNotification',
      id: randomUUID(),
      timestamp: createTimestamp(),
      performanceTimestamp: createPerformanceTimestamp(),
      root: createRootFromParent(patkaError),
      parent: some(patkaError.id),
      content: this.patkaAgentText.error(
        patkaError.error instanceof Error ? patkaError.error.message : String(patkaError.error),
      ),
    } satisfies PatkaUserNotification);
  }

  private generate(
    patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
    parent: PatkaContextEntry,
  ): Observable<PatkaContextEntry> {
    const patkaInferenceClientRequest: PatkaInferenceClientRequest = {
      type: 'PatkaInferenceClientRequest',
      id: randomUUID(),
      timestamp: createTimestamp(),
      performanceTimestamp: createPerformanceTimestamp(),
      root: createRootFromParent(parent),
      parent: some(parent.id),
      input: this.inferenceClientChatInputFactory.create(patkaContextEntries),
    };

    return concat(
      of(patkaInferenceClientRequest),
      this.inferenceClient.generate(patkaInferenceClientRequest.input).pipe(
        map(
          (inferenceClientResponse): PatkaInferenceClientResponse => ({
            type: 'PatkaInferenceClientResponse',
            id: randomUUID(),
            timestamp: createTimestamp(),
            performanceTimestamp: createPerformanceTimestamp(),
            root: createRootFromParent(patkaInferenceClientRequest),
            parent: some(patkaInferenceClientRequest.id),
            content: inferenceClientResponse.content,
            toolCall: inferenceClientResponse.toolCall,
            usage: inferenceClientResponse.usage,
          }),
        ),
        catchError(
          (error: unknown): Observable<PatkaError> =>
            of({
              type: 'PatkaError',
              id: randomUUID(),
              timestamp: createTimestamp(),
              performanceTimestamp: createPerformanceTimestamp(),
              root: createRootFromParent(patkaInferenceClientRequest),
              parent: some(patkaInferenceClientRequest.id),
              error,
            }),
        ),
      ),
    );
  }

  private processInferenceClientResponse(
    patkaInferenceClientResponse: PatkaInferenceClientResponse,
  ): Observable<PatkaContextEntry> {
    return match(patkaInferenceClientResponse.toolCall)
      .with(
        {type: 'some'},
        ({value}): Observable<PatkaContextEntry> =>
          of({
            type: 'PatkaToolCall',
            id: randomUUID(),
            timestamp: createTimestamp(),
            performanceTimestamp: createPerformanceTimestamp(),
            root: createRootFromParent(patkaInferenceClientResponse),
            parent: some(patkaInferenceClientResponse.id),
            name: value.name,
            input: value.input,
          } satisfies PatkaToolCall),
      )
      .with({type: 'none'}, (): Observable<PatkaContextEntry> => EMPTY)
      .exhaustive();
  }

  private useTool(patkaToolCall: PatkaToolCall): Observable<PatkaContextEntry> {
    return this.patkaTools.invoke(patkaToolCall.name, patkaToolCall.input).pipe(
      map(
        (output): PatkaContextEntry => ({
          type: 'PatkaToolOutput',
          id: randomUUID(),
          timestamp: createTimestamp(),
          performanceTimestamp: createPerformanceTimestamp(),
          root: createRootFromParent(patkaToolCall),
          parent: some(patkaToolCall.id),
          name: patkaToolCall.name,
          output,
        }),
      ),
      defaultIfEmpty({
        type: 'PatkaToolEmptyOutput',
        id: randomUUID(),
        timestamp: createTimestamp(),
        performanceTimestamp: createPerformanceTimestamp(),
        root: createRootFromParent(patkaToolCall),
        parent: some(patkaToolCall.id),
        name: patkaToolCall.name,
      } satisfies PatkaToolEmptyOutput),
      catchError((error: Error) =>
        of({
          type: 'PatkaToolInvocationError',
          id: randomUUID(),
          timestamp: createTimestamp(),
          performanceTimestamp: createPerformanceTimestamp(),
          root: createRootFromParent(patkaToolCall),
          parent: some(patkaToolCall.id),
          name: patkaToolCall.name,
          error,
        } satisfies PatkaToolInvocationError),
      ),
    );
  }
}
