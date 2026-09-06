import { randomUUID, type UUID } from "node:crypto";
import { BehaviorSubject, type Observable } from "rxjs";
import type { InferenceClient } from "../inference/inference-client.ts";
import type { PatkaMessage } from "../inference/patka-message.ts";
import { none, some } from "../option.ts";
import type { PatkaUtterance } from "../patka-utterance.ts";
import type { PatkaHistoryNode } from "./patka-history-node.ts";
import type { PatkaPromptFactory } from "./patka-prompt-factory.ts";

export class PatkaAgent {
  private readonly _history = new BehaviorSubject<ReadonlyArray<PatkaHistoryNode>>([]);
  private readonly inferenceClient: InferenceClient;
  private readonly promptFactory: PatkaPromptFactory;

  readonly name: string;
  readonly history: Observable<ReadonlyArray<PatkaHistoryNode>> = this._history.asObservable();

  constructor(name: string, inferenceClient: InferenceClient, promptFactory: PatkaPromptFactory) {
    this.name = name;
    this.inferenceClient = inferenceClient;
    this.promptFactory = promptFactory;
  }

  handle(utterance: PatkaUtterance): void {
    const answer: PatkaHistoryNode = { id: randomUUID(), role: "agent", utterance: none };

    this._history.next([
      ...this._history.value,
      { id: randomUUID(), role: "user", utterance: some(utterance) },
      answer,
    ]);

    this.inferenceClient
      .generate({ message: this.promptFactory.create(this._history.value), id: answer.id })
      .subscribe({
        next: (response: PatkaMessage): void => {
          this.fill(answer.id, {
            content: response.message,
            timestamp: new Date(),
            id: randomUUID(),
          });
        },
        // an agent that cannot answer leaves its node empty
        error: (): void => {},
      });
  }

  private fill(id: UUID, utterance: PatkaUtterance): void {
    this._history.next(
      this._history.value.map((node) =>
        node.id === id ? { ...node, utterance: some(utterance) } : node,
      ),
    );
  }
}
