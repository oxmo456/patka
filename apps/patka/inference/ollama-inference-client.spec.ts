import type {Ollama} from 'ollama';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import {OllamaInferenceClient} from './ollama-inference-client.ts';

describe('OllamaInferenceClient', () => {
  it('emits the generated content as a message', async () => {
    const ollama = {
      generate: vi.fn(async () => ({response: 'world'})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    const response = await firstValueFrom(ollamaInferenceClient.generate({prompt: 'hello'}));

    expect(response.content).toBe('world');
  });

  it('asks the configured model with the message as the prompt', async () => {
    const ollama = {
      generate: vi.fn(async () => ({response: 'world'})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    await firstValueFrom(ollamaInferenceClient.generate({prompt: 'hello'}));

    expect(ollama.generate).toHaveBeenCalledWith({
      model: 'llama3',
      prompt: 'hello',
    });
  });

  it('does not call Ollama until subscribed', () => {
    const ollama = {
      generate: vi.fn(async () => ({response: 'world'})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    ollamaInferenceClient.generate({prompt: 'hello'});

    expect(ollama.generate).not.toHaveBeenCalled();
  });
});
