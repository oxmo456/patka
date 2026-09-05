import type { Observable } from "rxjs";
import type { InferenceClient } from "./inference-client.ts";
import type { PatkaMessage } from "./patka-message.ts";

export class PatkaAgent {
  private readonly inferenceClient: InferenceClient;

  constructor(inferenceClient: InferenceClient) {
    this.inferenceClient = inferenceClient;
  }

  send(message: PatkaMessage): Observable<PatkaMessage> {
    return this.inferenceClient.generate(message);
  }
}
