import { randomUUID } from "node:crypto";
import { type Observable, Subject } from "rxjs";
import type { InferenceClient } from "./inference-client.ts";
import { none, some } from "./option.ts";
import type { PatkaExchange } from "./patka-exchange.ts";
import type { PatkaMessage } from "./patka-message.ts";
import type { PatkaUtterance } from "./patka-utterance.ts";

export class PatkaAgent {
  private readonly _exchanges = new Subject<PatkaExchange>();
  private readonly inferenceClient: InferenceClient;

  readonly name: string;
  readonly exchanges: Observable<PatkaExchange> = this._exchanges.asObservable();

  constructor(name: string, inferenceClient: InferenceClient) {
    this.name = name;
    this.inferenceClient = inferenceClient;
  }

  handle(utterance: PatkaUtterance): void {
    const exchange: PatkaExchange = {
      id: randomUUID(),
      utterance,
      status: "pending",
      response: none,
    };

    this._exchanges.next(exchange);
    this.inferenceClient.generate({ message: utterance.content, id: exchange.id }).subscribe({
      next: (response: PatkaMessage): void => {
        this._exchanges.next({
          ...exchange,
          status: "answered",
          response: some({ content: response.message, timestamp: new Date(), id: randomUUID() }),
        });
      },
      error: (): void => {
        this._exchanges.next({ ...exchange, status: "failed", response: none });
      },
    });
  }
}
