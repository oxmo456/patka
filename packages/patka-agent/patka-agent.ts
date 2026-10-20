import {randomUUID} from 'node:crypto';
import {catchError, concatMap, defaultIfEmpty, EMPTY, map, type Observable, of, scan} from 'rxjs';
import {match} from 'ts-pattern';
import {type Option, some} from '../option/option.ts';
import type {
  PatkaAgentUtterance,
  PatkaContextEntry,
  PatkaError,
  PatkaInferenceClientResponse,
  PatkaToolCall,
  PatkaToolEmptyOutput,
  PatkaToolInvocationError,
  PatkaUserNotification,
} from '../patka-context/patka-context-entry.ts';
import type {PatkaContextEntryID} from '../patka-context/patka-context-entry-id.ts';
import type {InferenceClient} from '../patka-inference/inference-client.ts';
import type {PatkaPromptFactory} from '../patka-prompt/patka-prompt-factory.ts';
import {PatkaToolProtocol} from '../patka-tool/patka-tool-protocol.ts';
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
  private readonly patkaPromptFactory: PatkaPromptFactory;
  private readonly inferenceClient: InferenceClient;
  private readonly patkaAgentText: PatkaAgentText;
  private readonly patkaToolProtocol = new PatkaToolProtocol();

  readonly name: string;
  readonly output: Observable<PatkaContextEntry>;

  constructor(
    name: string,
    patkaTools: PatkaTools,
    inferenceClient: InferenceClient,
    input: Observable<PatkaContextEntry>,
    patkaPromptFactory: PatkaPromptFactory,
    patkaAgentText: PatkaAgentText,
  ) {
    this.name = name;
    this.patkaTools = patkaTools;
    this.inferenceClient = inferenceClient;
    this.patkaPromptFactory = patkaPromptFactory;
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
      .with({type: 'PatkaAgentUtterance'}, () =>
        this.generate(patkaContextEntries, lastPatkaContextEntry),
      )
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
    const prompt = this.patkaPromptFactory.create(patkaContextEntries);

    return this.inferenceClient.generate({prompt}).pipe(
      map(
        (inferenceClientResponse): PatkaInferenceClientResponse => ({
          type: 'PatkaInferenceClientResponse',
          id: randomUUID(),
          timestamp: createTimestamp(),
          performanceTimestamp: createPerformanceTimestamp(),
          root: createRootFromParent(parent),
          parent: some(parent.id),
          content: inferenceClientResponse.content,
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
            root: createRootFromParent(parent),
            parent: some(parent.id),
            error,
          }),
      ),
    );
  }

  private processInferenceClientResponse(
    patkaInferenceClientResponse: PatkaInferenceClientResponse,
  ): Observable<PatkaContextEntry> {
    return match(this.patkaToolProtocol.parse(patkaInferenceClientResponse.content))
      .with(
        {type: 'success'},
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
      .with(
        {type: 'failure'},
        ({error}): Observable<PatkaContextEntry> =>
          this.patkaToolProtocol.isAPatkaToolInvocation(patkaInferenceClientResponse.content)
            ? of({
                type: 'PatkaAgentUtterance',
                id: randomUUID(),
                timestamp: createTimestamp(),
                performanceTimestamp: createPerformanceTimestamp(),
                root: createRootFromParent(patkaInferenceClientResponse),
                parent: some(patkaInferenceClientResponse.id),
                content: this.patkaAgentText.unreadableToolInvocation(error.message),
              } satisfies PatkaAgentUtterance)
            : EMPTY,
      )
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
