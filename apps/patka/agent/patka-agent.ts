import {randomUUID} from 'node:crypto';
import {catchError, concatMap, EMPTY, map, type Observable, of, scan} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import {PATKA_CONTEXT_ENTRIES} from '../context/patka-context-entries.token.ts';
import type {
  PatkaContextEntry,
  PatkaReply,
  PatkaToolCall,
  PatkaToolResult,
} from '../context/patka-context-entry.ts';
import {INFERENCE_CLIENT} from '../inference/inference-client.token.ts';
import type {InferenceClient} from '../inference/inference-client.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {AGENT_NAME} from './agent-name.token.ts';
import {DefaultPatkaPromptFactory} from './default-patka-prompt-factory.ts';
import type {PatkaPromptFactory} from './patka-prompt-factory.ts';

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
  ) {
    this.name = name;
    this.patkaTools = patkaTools;
    this.inferenceClient = inferenceClient;
    this.patkaPromptFactory = new DefaultPatkaPromptFactory(patkaTools);
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
      .with({type: 'PatkaToolResult'}, () => this.generate(patkaContextEntries))
      .with({type: 'PatkaReply'}, (patkaReply) => this.afterReply(patkaReply))
      .with({type: 'PatkaToolCall'}, (patkaToolCall) => this.useTool(patkaToolCall))
      .exhaustive();
  }

  private generate(
    patkaContextEntries: ReadonlyArray<PatkaContextEntry>,
  ): Observable<PatkaContextEntry> {
    const prompt = this.patkaPromptFactory.create(patkaContextEntries);

    return this.inferenceClient.generate({message: prompt, id: randomUUID()}).pipe(
      map(
        (patkaMessage): PatkaReply => ({
          type: 'PatkaReply',
          id: randomUUID(),
          content: patkaMessage.message,
        }),
      ),
      catchError(() => EMPTY),
    );
  }

  private afterReply(patkaReply: PatkaReply): Observable<PatkaContextEntry> {
    return match(this.patkaToolProtocol.parse(patkaReply.content))
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
        (output): PatkaToolResult => ({
          type: 'PatkaToolResult',
          id: randomUUID(),
          name: patkaToolCall.name,
          output,
        }),
      ),
      catchError(() => EMPTY),
    );
  }
}
