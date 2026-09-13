import {randomUUID, type UUID} from 'node:crypto';
import {BehaviorSubject, defer, map, type Observable, of, switchMap} from 'rxjs';
import {inject, injectable} from 'tsyringe';
import {INFERENCE_CLIENT} from '../inference/inference-client.token.ts';
import type {InferenceClient} from '../inference/inference-client.ts';
import type {PatkaMessage} from '../inference/patka-message.ts';
import {none, some} from '../option.ts';
import type {PatkaUtterance} from '../patka-utterance.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {isSuccess} from '../try.ts';
import {AGENT_NAME} from './agent-name.token.ts';
import {DefaultPatkaPromptFactory} from './default-patka-prompt-factory.ts';
import type {PatkaConversation, PatkaConversationEntry} from './patka-conversation.ts';
import type {PatkaPromptFactory} from './patka-prompt-factory.ts';

const ASSISTANT = 'Assistant';

@injectable()
export class PatkaAgent {
  private readonly _patkaConversation = new BehaviorSubject<PatkaConversation>([]);
  private readonly inferenceClient: InferenceClient;
  private readonly patkaPromptFactory: PatkaPromptFactory;
  private readonly patkaTools: PatkaTools;
  private readonly patkaToolProtocol = new PatkaToolProtocol();

  readonly name: string;
  readonly patkaConversation: Observable<PatkaConversation> =
    this._patkaConversation.asObservable();

  constructor(
    @inject(AGENT_NAME) name: string,
    @inject(INFERENCE_CLIENT) inferenceClient: InferenceClient,
    @inject(PatkaTools) patkaTools: PatkaTools,
  ) {
    this.name = name;
    this.inferenceClient = inferenceClient;
    this.patkaTools = patkaTools;
    this.patkaPromptFactory = new DefaultPatkaPromptFactory(patkaTools);
  }

  handle(patkaUtterance: PatkaUtterance): void {
    const answer: PatkaConversationEntry = {id: randomUUID(), role: 'agent', utterance: none};

    this._patkaConversation.next([
      ...this._patkaConversation.value,
      {id: randomUUID(), role: 'user', utterance: some(patkaUtterance)},
      answer,
    ]);

    const prompt = this.patkaPromptFactory.create(this._patkaConversation.value);

    this.generate(prompt)
      .pipe(switchMap((reply) => this.useToolIfAsked(prompt, reply, answer.id)))
      .subscribe({
        next: (content: string): void => {
          this.say(answer.id, content);
        },
        error: (): void => {},
      });
  }

  private generate(prompt: string): Observable<string> {
    return this.inferenceClient
      .generate({message: prompt, id: randomUUID()})
      .pipe(map((patkaMessage: PatkaMessage) => patkaMessage.message));
  }

  private useToolIfAsked(prompt: string, reply: string, answerId: UUID): Observable<string> {
    if (!this.patkaToolProtocol.isAPatkaToolInvocation(reply)) {
      return of(reply);
    }

    const asked = this.patkaToolProtocol.parse(reply);

    if (!isSuccess(asked)) {
      return of(reply);
    }

    return defer(() => {
      this.say(answerId, this.patkaToolProtocol.progress(asked.value));

      return this.patkaTools.invoke(asked.value.name, asked.value.input);
    }).pipe(
      switchMap((output) =>
        this.generate(`${prompt} ${this.patkaToolProtocol.outcome(reply, output)}\n${ASSISTANT}:`),
      ),
    );
  }

  private say(id: UUID, content: string): void {
    this.fill(id, {content, timestamp: new Date(), id: randomUUID()});
  }

  private fill(id: UUID, patkaUtterance: PatkaUtterance): void {
    this._patkaConversation.next(
      this._patkaConversation.value.map((patkaConversationEntry) =>
        patkaConversationEntry.id === id
          ? {...patkaConversationEntry, utterance: some(patkaUtterance)}
          : patkaConversationEntry,
      ),
    );
  }
}
