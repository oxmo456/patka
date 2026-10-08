import {randomUUID} from 'node:crypto';
import {catchError, concatMap, EMPTY, map, type Observable, of, scan} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import {PATKA_CONTEXT_ENTRIES} from '../context/patka-context-entries.token.ts';
import type {
  PatkaContextEntry,
  PatkaError,
  PatkaInferenceClientResponse,
  PatkaToolCall,
  PatkaToolOutput,
  PatkaUserNotification,
} from '../context/patka-context-entry.ts';
import {INFERENCE_CLIENT} from '../inference/inference-client.token.ts';
import type {InferenceClient} from '../inference/inference-client.ts';
import {DefaultPatkaPromptFactory} from '../prompt/default-patka-prompt-factory.ts';
import type {PatkaPromptFactory} from '../prompt/patka-prompt-factory.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {REPORT_INCOMPETENCY} from '../tools/report-incompetency/report-incompetency.ts';
import {WORKING_DIRECTORY} from '../working-directory.token.ts';
import {AGENT_NAME} from './agent-name.token.ts';

const MISSING_TOOLS_NOTIFICATION =
  'Patka agent is not providing the necessary tools for the LLM to complete the task.';

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
    @inject(WORKING_DIRECTORY) workingDirectory: string,
  ) {
    this.name = name;
    this.patkaTools = patkaTools;
    this.inferenceClient = inferenceClient;
    this.patkaPromptFactory = new DefaultPatkaPromptFactory(patkaTools, workingDirectory);
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
      .with({type: 'PatkaUserUtterance'}, () => this.generate(patkaContextEntries))
      .with({type: 'PatkaToolOutput', name: REPORT_INCOMPETENCY}, () => this.notifyMissingTools())
      .with({type: 'PatkaToolOutput'}, () => this.generate(patkaContextEntries))
      .with({type: 'PatkaInferenceClientResponse'}, (patkaInferenceClientResponse) =>
        this.processInferenceClientResponse(patkaInferenceClientResponse),
      )
      .with({type: 'PatkaToolCall'}, (patkaToolCall) => this.useTool(patkaToolCall))
      .with({type: 'PatkaUserNotification'}, () => EMPTY)
      .with({type: 'PatkaError'}, () => EMPTY)
      .exhaustive();
  }

  private notifyMissingTools(): Observable<PatkaContextEntry> {
    return of({
      type: 'PatkaUserNotification',
      id: randomUUID(),
      content: MISSING_TOOLS_NOTIFICATION,
    } satisfies PatkaUserNotification);
  }

  private generate(
    patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
  ): Observable<PatkaContextEntry> {
    const prompt = this.patkaPromptFactory.create(patkaContextEntries);

    return this.inferenceClient.generate({prompt}).pipe(
      map(
        (inferenceClientResponse): PatkaInferenceClientResponse => ({
          type: 'PatkaInferenceClientResponse',
          id: randomUUID(),
          content: inferenceClientResponse.content,
        }),
      ),
      catchError(
        (error: unknown): Observable<PatkaError> =>
          of({
            type: 'PatkaError',
            id: randomUUID(),
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
            name: value.name,
            input: value.input,
          } satisfies PatkaToolCall),
      )
      .with({type: 'failure'}, () => EMPTY)
      .exhaustive();
  }

  private useTool(patkaToolCall: PatkaToolCall): Observable<PatkaContextEntry> {
    return this.patkaTools.invoke(patkaToolCall.name, patkaToolCall.input).pipe(
      map(
        (output): PatkaToolOutput => ({
          type: 'PatkaToolOutput',
          id: randomUUID(),
          name: patkaToolCall.name,
          output,
        }),
      ),
    );
  }
}
