import { randomUUID } from "node:crypto";
import type { Ollama } from "ollama";
import { defer, from, map, type Observable } from "rxjs";
import type { InferenceClient } from "./inference-client.ts";
import type { PatkaMessage } from "./patka-message.ts";

export class OllamaInferenceClient implements InferenceClient {
  private readonly model: string;
  private readonly ollama: Ollama;

  constructor(model: string, ollama: Ollama) {
    this.model = model;
    this.ollama = ollama;
  }

  generate(message: PatkaMessage): Observable<PatkaMessage> {
    return defer(() =>
      from(
        this.ollama.generate({
          model: this.model,
          prompt: message.message,
        }),
      ),
    ).pipe(map((response) => ({ message: response.response, id: randomUUID() })));
  }
}
