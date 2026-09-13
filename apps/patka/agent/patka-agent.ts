import {randomUUID, type UUID} from 'node:crypto';
import {BehaviorSubject, type Observable} from 'rxjs';
import {inject, injectable} from 'tsyringe';
import {none, some} from '../option.ts';
import type {PatkaUtterance} from '../patka-utterance.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {AGENT_NAME} from './agent-name.token.ts';
import {DefaultPatkaPromptFactory} from './default-patka-prompt-factory.ts';
import {PatkaAgentLoop} from './patka-agent-loop.ts';
import type {PatkaConversation, PatkaConversationEntry} from './patka-conversation.ts';
import type {PatkaPromptFactory} from './patka-prompt-factory.ts';

@injectable()
export class PatkaAgent {
  private readonly _patkaConversation = new BehaviorSubject<PatkaConversation>([]);
  private readonly patkaPromptFactory: PatkaPromptFactory;
  private readonly patkaAgentLoop: PatkaAgentLoop;

  readonly name: string;
  readonly patkaConversation: Observable<PatkaConversation> =
    this._patkaConversation.asObservable();

  constructor(
    @inject(AGENT_NAME) name: string,
    @inject(PatkaTools) patkaTools: PatkaTools,
    @inject(PatkaAgentLoop) patkaAgentLoop: PatkaAgentLoop,
  ) {
    this.name = name;
    this.patkaAgentLoop = patkaAgentLoop;
    this.patkaPromptFactory = new DefaultPatkaPromptFactory(patkaTools);
  }

  handle(patkaUtterance: PatkaUtterance): void {
    const answer: PatkaConversationEntry = {id: randomUUID(), role: 'agent', utterance: none};

    this._patkaConversation.next([
      ...this._patkaConversation.value,
      {id: randomUUID(), role: 'user', utterance: some(patkaUtterance)},
      answer,
    ]);

    this.patkaAgentLoop
      .handle(this.patkaPromptFactory.create(this._patkaConversation.value))
      .subscribe({
        next: (content: string): void => {
          this.say(answer.id, content);
        },
        error: (): void => {},
      });
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
