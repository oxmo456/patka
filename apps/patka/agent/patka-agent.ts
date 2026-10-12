import {randomUUID} from 'node:crypto';
import {catchError, concatMap, EMPTY, map, type Observable, of, scan} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import {PATKA_CONTEXT_ENTRIES} from '../context/patka-context-entries.token.ts';
import type {
  PatkaAgentUtterance,
  PatkaContextEntry,
  PatkaError,
  PatkaInferenceClientResponse,
  PatkaToolCall,
  PatkaToolOutput,
  PatkaUserNotification,
} from '../context/patka-context-entry.ts';
import type {PatkaContextEntryID} from '../context/patka-context-entry-id.ts';
import {INFERENCE_CLIENT} from '../inference/inference-client.token.ts';
import type {InferenceClient} from '../inference/inference-client.ts';
import {type Option, some} from '../option.ts';
import {createPerformanceTimestamp} from '../performance-timestamp.ts';
import {PATKA_PROMPT_FACTORY} from '../prompt/patka-prompt-factory.token.ts';
import type {PatkaPromptFactory} from '../prompt/patka-prompt-factory.ts';
import {createTimestamp} from '../timestamp.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {REPORT_INCOMPETENCY} from '../tools/report-incompetency/report-incompetency.ts';
import {AGENT_NAME} from './agent-name.token.ts';

const MISSING_TOOLS_NOTIFICATION =
  'Patka agent is not providing the necessary tools for the LLM to complete the task.';

function createRootFromParent(parent: PatkaContextEntry): Option<PatkaContextEntryID> {
  return parent.root.type === 'some' ? parent.root : some(parent.id);
}

@injectable()
export class PatkaAgent {
  private readonly patkaTools: PatkaTools;
  private readonly patkaPromptFactory: PatkaPromptFactory;
  private readonly inferenceClient: InferenceClient;
  private readonly patkaToolProtocol = new PatkaToolProtocol();

  readonly name: string;
  readonly output: Observable<PatkaContextEntry>;

  constructor(
    @inject(AGENT_NAME) name: string,
    @inject(PatkaTools) patkaTools: PatkaTools,
    @inject(INFERENCE_CLIENT) inferenceClient: InferenceClient,
    @inject(PATKA_CONTEXT_ENTRIES) input: Observable<PatkaContextEntry>,
    @inject(PATKA_PROMPT_FACTORY) patkaPromptFactory: PatkaPromptFactory,
  ) {
    this.name = name;
    this.patkaTools = patkaTools;
    this.inferenceClient = inferenceClient;
    this.patkaPromptFactory = patkaPromptFactory;
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
      .with({type: 'PatkaToolOutput', name: REPORT_INCOMPETENCY}, () =>
        this.notifyMissingTools(lastPatkaContextEntry),
      )
      .with({type: 'PatkaToolOutput'}, () =>
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
      content: MISSING_TOOLS_NOTIFICATION,
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
      content: `Oops something went wrong... ${patkaError.error instanceof Error ? patkaError.error.message : String(patkaError.error)}`,
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
                content: `Patka could not read your tool invocation: ${error.message}`,
              } satisfies PatkaAgentUtterance)
            : EMPTY,
      )
      .exhaustive();
  }

  private useTool(patkaToolCall: PatkaToolCall): Observable<PatkaContextEntry> {
    return this.patkaTools.invoke(patkaToolCall.name, patkaToolCall.input).pipe(
      map(
        (output): PatkaToolOutput => ({
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
    );
  }
}
