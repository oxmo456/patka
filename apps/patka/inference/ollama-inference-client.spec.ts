import type {Ollama} from 'ollama';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import {none, some} from '../../../packages/option/option.ts';
import {OllamaInferenceClient} from './ollama-inference-client.ts';

describe('OllamaInferenceClient', () => {
  it('emits the content the model answered', async () => {
    const ollama = {
      chat: vi.fn(async () => ({message: {role: 'assistant', content: 'world'}})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    const response = await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(response.content).toBe('world');
  });

  it('removes an unfinished tool call tag at the end of the content', async () => {
    const ollama = {
      chat: vi.fn(async () => ({
        message: {role: 'assistant', content: 'Logs are hidden.<tool_call>'},
      })),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    const response = await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hide the logs'}],
        tools: [],
      }),
    );

    expect(response.content).toBe('Logs are hidden.');
  });

  it('gives the tokens sent and received', async () => {
    const ollama = {
      chat: vi.fn(async () => ({
        message: {role: 'assistant', content: 'world'},
        prompt_eval_count: 3,
        eval_count: 5,
      })),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    const response = await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(response.usage).toEqual({inputTokens: 3, outputTokens: 5});
  });

  it('gives zero tokens sent when Ollama does not count them', async () => {
    const ollama = {
      chat: vi.fn(async () => ({message: {role: 'assistant', content: 'world'}, eval_count: 5})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    const response = await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(response.usage.inputTokens).toBe(0);
  });

  it('asks the configured model', async () => {
    const ollama = {
      chat: vi.fn(async () => ({message: {role: 'assistant', content: 'world'}})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(ollama.chat).toHaveBeenCalledWith(expect.objectContaining({model: 'llama3'}));
  });

  it('sends the system prompt as the first message, then the messages', async () => {
    const ollama = {
      chat: vi.fn(async () => ({message: {role: 'assistant', content: 'world'}})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(ollama.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {role: 'system', content: 'be brief'},
          {role: 'user', content: 'hello'},
        ],
      }),
    );
  });

  it('sends an assistant message that uses a tool as a tool call', async () => {
    const ollama = {
      chat: vi.fn(async () => ({message: {role: 'assistant', content: 'world'}})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [
          {
            role: 'assistant',
            content: '',
            toolUse: some({id: 'call-1', name: 'read_file', input: {relativePath: 'note.txt'}}),
          },
        ],
        tools: [],
      }),
    );

    expect(ollama.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {role: 'system', content: 'be brief'},
          {
            role: 'assistant',
            content: '',
            tool_calls: [{function: {name: 'read_file', arguments: {relativePath: 'note.txt'}}}],
          },
        ],
      }),
    );
  });

  it('sends a tool message with the name of its tool', async () => {
    const ollama = {
      chat: vi.fn(async () => ({message: {role: 'assistant', content: 'world'}})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [
          {
            role: 'tool',
            toolUseId: 'call-1',
            name: 'read_file',
            content: '"hello"',
            isError: false,
          },
        ],
        tools: [],
      }),
    );

    expect(ollama.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {role: 'system', content: 'be brief'},
          {role: 'tool', content: '"hello"', tool_name: 'read_file'},
        ],
      }),
    );
  });

  it('sends the tools as functions', async () => {
    const ollama = {
      chat: vi.fn(async () => ({message: {role: 'assistant', content: 'world'}})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [{name: 'read_file', description: 'Reads a file.', inputSchema: {type: 'object'}}],
      }),
    );

    expect(ollama.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [
          {
            type: 'function',
            function: {
              name: 'read_file',
              description: 'Reads a file.',
              parameters: {type: 'object'},
            },
          },
        ],
      }),
    );
  });

  it('gives the tool call the model asked for', async () => {
    const ollama = {
      chat: vi.fn(async () => ({
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [{function: {name: 'read_file', arguments: {relativePath: 'note.txt'}}}],
        },
      })),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    const response = await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'read note.txt'}],
        tools: [],
      }),
    );

    expect(response.toolCall).toEqual(some({name: 'read_file', input: {relativePath: 'note.txt'}}));
  });

  it('gives no tool call when the model just answered', async () => {
    const ollama = {
      chat: vi.fn(async () => ({message: {role: 'assistant', content: 'world'}})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    const response = await firstValueFrom(
      ollamaInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(response.toolCall).toEqual(none);
  });

  it('does not call Ollama until subscribed', () => {
    const ollama = {
      chat: vi.fn(async () => ({message: {role: 'assistant', content: 'world'}})),
    } as unknown as Ollama;
    const ollamaInferenceClient = new OllamaInferenceClient('llama3', ollama);

    ollamaInferenceClient.chat({
      system: 'be brief',
      messages: [{role: 'user', content: 'hello'}],
      tools: [],
    });

    expect(ollama.chat).not.toHaveBeenCalled();
  });
});
