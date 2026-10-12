import type {Ollama} from 'ollama';
import {defer, from, map, type Observable} from 'rxjs';
import type {InferenceClient} from '../../../packages/agent/inference/inference-client.ts';
import type {InferenceClientInput} from '../../../packages/agent/inference/inference-client-input.ts';
import type {InferenceClientResponse} from '../../../packages/agent/inference/inference-client-response.ts';

export class OllamaInferenceClient implements InferenceClient {
  private readonly model: string;
  private readonly ollama: Ollama;

  constructor(model: string, ollama: Ollama) {
    this.model = model;
    this.ollama = ollama;
  }

  generate(inferenceClientInput: InferenceClientInput): Observable<InferenceClientResponse> {
    return defer(() =>
      from(
        this.ollama.generate({
          model: this.model,
          prompt: inferenceClientInput.prompt,
        }),
      ),
    ).pipe(
      map((response) => ({
        content: response.response,
        usage: {
          inputTokens: response.prompt_eval_count ?? 0,
          outputTokens: response.eval_count ?? 0,
        },
      })),
    );
  }
}
