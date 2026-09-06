import { randomUUID } from "node:crypto";
import { type Observable, Subject } from "rxjs";
import type { InferenceClient } from "./inference-client.ts";
import type { PatkaMessage } from "./patka-message.ts";
import type { PatkaPrompt } from "./patka-prompt.ts";
import type { PatkaTurn } from "./patka-turn.ts";

export class PatkaAgent {
  private readonly _turns = new Subject<PatkaTurn>();
  private readonly inferenceClient: InferenceClient;

  readonly name: string;
  readonly turns: Observable<PatkaTurn> = this._turns.asObservable();

  constructor(name: string, inferenceClient: InferenceClient) {
    this.name = name;
    this.inferenceClient = inferenceClient;
  }

  ask(prompt: PatkaPrompt): void {
    const turn: PatkaTurn = {
      id: randomUUID(),
      prompt,
      status: "pending",
      response: undefined,
    };

    this._turns.next(turn);
    this.inferenceClient.generate({ message: prompt.content, id: turn.id }).subscribe({
      next: (response: PatkaMessage): void => {
        this._turns.next({ ...turn, status: "answered", response: response.message });
      },
      error: (): void => {
        this._turns.next({ ...turn, status: "failed", response: undefined });
      },
    });
  }
}
