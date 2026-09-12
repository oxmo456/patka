import {randomUUID, type UUID} from 'node:crypto';
import {BehaviorSubject, defer, map, type Observable, of, switchMap} from 'rxjs';
import type {InferenceClient} from '../inference/inference-client.ts';
import type {PatkaMessage} from '../inference/patka-message.ts';
import {none, some} from '../option.ts';
import type {PatkaUtterance} from '../patka-utterance.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import type {PatkaTools} from '../tools/patka-tools.ts';
import {isSuccess} from '../try.ts';
import {DefaultPatkaPromptFactory} from './default-patka-prompt-factory.ts';
import type {PatkaConversation, PatkaConversationEntry} from './patka-conversation.ts';
import type {PatkaPromptFactory} from './patka-prompt-factory.ts';

const ASSISTANT = 'Assistant';

export class PatkaAgent {
  private readonly _history = new BehaviorSubject<PatkaConversation>([]);
  private readonly inferenceClient: InferenceClient;
  private readonly promptFactory: PatkaPromptFactory;
  private readonly patkaTools: PatkaTools;
  private readonly protocol = new PatkaToolProtocol();

  readonly name: string;
  readonly history: Observable<PatkaConversation> = this._history.asObservable();

  constructor(name: string, inferenceClient: InferenceClient, patkaTools: PatkaTools) {
    this.name = name;
    this.inferenceClient = inferenceClient;
    this.patkaTools = patkaTools;
    this.promptFactory = new DefaultPatkaPromptFactory(patkaTools);
  }

  handle(utterance: PatkaUtterance): void {
    const answer: PatkaConversationEntry = {id: randomUUID(), role: 'agent', utterance: none};

    this._history.next([
      ...this._history.value,
      {id: randomUUID(), role: 'user', utterance: some(utterance)},
      answer,
    ]);

    const prompt = this.promptFactory.create(this._history.value);

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
      .pipe(map((response: PatkaMessage) => response.message));
  }

  private useToolIfAsked(prompt: string, reply: string, answerId: UUID): Observable<string> {
    if (!this.protocol.isAPatkaToolInvocation(reply)) {
      return of(reply);
    }

    const asked = this.protocol.parse(reply);

    if (!isSuccess(asked)) {
      return of(reply);
    }

    return defer(() => {
      this.say(answerId, this.protocol.progress(asked.value));

      return this.patkaTools.invoke(asked.value.name, asked.value.input);
    }).pipe(
      switchMap((output) =>
        this.generate(`${prompt} ${this.protocol.outcome(reply, output)}\n${ASSISTANT}:`),
      ),
    );
  }

  private say(id: UUID, content: string): void {
    this.fill(id, {content, timestamp: new Date(), id: randomUUID()});
  }

  private fill(id: UUID, utterance: PatkaUtterance): void {
    this._history.next(
      this._history.value.map((node) =>
        node.id === id ? {...node, utterance: some(utterance)} : node,
      ),
    );
  }
}
