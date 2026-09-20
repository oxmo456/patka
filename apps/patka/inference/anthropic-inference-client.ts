import type Anthropic from '@anthropic-ai/sdk';
import {defer, from, map, type Observable} from 'rxjs';
import type {InferenceClient} from './inference-client.ts';
import type {InferenceClientInput} from './inference-client-input.ts';
import type {InferenceClientResponse} from './inference-client-response.ts';

const MAX_TOKENS = 16000;

const toContent = (response: Anthropic.Message): string =>
  response.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
    .trim();

export class AnthropicInferenceClient implements InferenceClient {
  private readonly model: string;
  private readonly anthropic: Anthropic;

  constructor(model: string, anthropic: Anthropic) {
    this.model = model;
    this.anthropic = anthropic;
  }

  generate(inferenceClientInput: InferenceClientInput): Observable<InferenceClientResponse> {
    return defer(() =>
      from(
        this.anthropic.messages.create({
          model: this.model,
          max_tokens: MAX_TOKENS,
          messages: [{role: 'user', content: inferenceClientInput.prompt}],
        }),
      ),
    ).pipe(map((response) => ({content: toContent(response)})));
  }
}
