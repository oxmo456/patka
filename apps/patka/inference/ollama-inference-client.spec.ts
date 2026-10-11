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

  it('gives the tokens sent and received', async () => {
    const ollama = {
      generate: vi.fn(async () => ({response: 'world', prompt_eval_count: 3, eval_count: 5})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    const response = await firstValueFrom(ollamaInferenceClient.generate({prompt: 'hello'}));

    expect(response.usage).toEqual({inputTokens: 3, outputTokens: 5});
  });

  it('gives zero tokens sent when Ollama does not count them', async () => {
    const ollama = {
      generate: vi.fn(async () => ({response: 'world', eval_count: 5})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    const response = await firstValueFrom(ollamaInferenceClient.generate({prompt: 'hello'}));

    expect(response.usage.inputTokens).toBe(0);
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
