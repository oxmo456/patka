import { randomUUID } from "node:crypto";
import { Subject, switchMap } from "rxjs";
import type { InferenceClient } from "./inference-client.ts";

export class PatkaAgent {
  private readonly inputMessages = new Subject<string>();
  private readonly inferenceClient: InferenceClient;

  readonly responses = this.inputMessages.pipe(
    switchMap((message) => this.inferenceClient.generate({ message, id: randomUUID() })),
  );

  constructor(inferenceClient: InferenceClient) {
    this.inferenceClient = inferenceClient;
  }

  send(message: string): void {
    this.inputMessages.next(message);
  }
}
