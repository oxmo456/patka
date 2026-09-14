import {randomUUID} from 'node:crypto';
import {concat, defer, map, type Observable, of, switchMap} from 'rxjs';
import {inject, injectable} from 'tsyringe';
import {INFERENCE_CLIENT} from '../inference/inference-client.token.ts';
import type {InferenceClient} from '../inference/inference-client.ts';
import type {PatkaMessage} from '../inference/patka-message.ts';
import {PatkaLogger} from '../patka-logger.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {isSuccess} from '../try.ts';
import {AGENT_NAME} from './agent-name.token.ts';

const ASSISTANT = 'Assistant';

const MAX_ROUNDS = 100;

@injectable()
export class PatkaAgentLoop {
  private readonly name: string;
  private readonly inferenceClient: InferenceClient;
  private readonly patkaTools: PatkaTools;
  private readonly patkaLogger: PatkaLogger;
  private readonly patkaToolProtocol = new PatkaToolProtocol();

  constructor(
    @inject(AGENT_NAME) name: string,
    @inject(INFERENCE_CLIENT) inferenceClient: InferenceClient,
    @inject(PatkaTools) patkaTools: PatkaTools,
    @inject(PatkaLogger) patkaLogger: PatkaLogger,
  ) {
    this.name = name;
    this.inferenceClient = inferenceClient;
    this.patkaTools = patkaTools;
    this.patkaLogger = patkaLogger;
  }

  handle(prompt: string): Observable<string> {
    return this.round(prompt, 1);
  }

  private round(prompt: string, count: number): Observable<string> {
    return this.generate(prompt).pipe(switchMap((reply) => this.afterReply(prompt, reply, count)));
  }

  private afterReply(prompt: string, reply: string, count: number): Observable<string> {
    if (!this.patkaToolProtocol.isAPatkaToolInvocation(reply)) {
      return of(reply);
    }

    const asked = this.patkaToolProtocol.parse(reply);

    if (!isSuccess(asked)) {
      return of(reply);
    }

    if (count >= MAX_ROUNDS) {
      this.patkaLogger.error(`${this.name} stops after ${MAX_ROUNDS} tool rounds`, {reply});

      return of(reply);
    }

    return concat(
      of(this.patkaToolProtocol.progress(asked.value)),
      defer(() => this.patkaTools.invoke(asked.value.name, asked.value.input)).pipe(
        switchMap((output) =>
          this.round(
            `${prompt} ${this.patkaToolProtocol.outcome(reply, output)}\n${ASSISTANT}:`,
            count + 1,
          ),
        ),
      ),
    );
  }

  private generate(prompt: string): Observable<string> {
    this.patkaLogger.info(`${this.name} prompts the engine`, {prompt});

    return this.inferenceClient
      .generate({message: prompt, id: randomUUID()})
      .pipe(map((patkaMessage: PatkaMessage) => patkaMessage.message));
  }
}
