import type Anthropic from '@anthropic-ai/sdk';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import {none, some} from '../option/option.ts';
import {AnthropicInferenceClient} from './anthropic-inference-client.ts';

const anAnthropic = (create: () => unknown): Anthropic =>
  ({messages: {create}}) as unknown as Anthropic;

describe('AnthropicInferenceClient', () => {
  it('emits the text the model answered', async () => {
    const anthropic = anAnthropic(async () => ({
      content: [{type: 'text', text: 'world'}],
      usage: {input_tokens: 3, output_tokens: 5},
    }));
    const anthropicInferenceClient = new AnthropicInferenceClient('claude-opus-5', anthropic);

    const response = await firstValueFrom(
      anthropicInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(response.content).toBe('world');
  });

  it('gives the tokens sent and received', async () => {
    const anthropic = anAnthropic(async () => ({
      content: [{type: 'text', text: 'world'}],
      usage: {input_tokens: 3, output_tokens: 5},
    }));
    const anthropicInferenceClient = new AnthropicInferenceClient('claude-opus-5', anthropic);

    const response = await firstValueFrom(
      anthropicInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(response.usage).toEqual({inputTokens: 3, outputTokens: 5});
  });

  it('joins every text block the model answered', async () => {
    const anthropic = anAnthropic(async () => ({
      content: [
        {type: 'thinking', thinking: ''},
        {type: 'text', text: 'hello '},
        {type: 'text', text: 'world'},
      ],
      usage: {input_tokens: 3, output_tokens: 5},
    }));
    const anthropicInferenceClient = new AnthropicInferenceClient('claude-opus-5', anthropic);

    const response = await firstValueFrom(
      anthropicInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(response.content).toBe('hello world');
  });

  it('asks the configured model with the system prompt and the messages', async () => {
    const create = vi.fn(async () => ({
      content: [{type: 'text', text: 'world'}],
      usage: {input_tokens: 3, output_tokens: 5},
    }));
    const anthropicInferenceClient = new AnthropicInferenceClient(
      'claude-opus-5',
      anAnthropic(create),
    );

    await firstValueFrom(
      anthropicInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-opus-5',
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
      }),
    );
  });

  it('sends an assistant message that uses a tool as a tool use block', async () => {
    const create = vi.fn(async () => ({
      content: [{type: 'text', text: 'world'}],
      usage: {input_tokens: 3, output_tokens: 5},
    }));
    const anthropicInferenceClient = new AnthropicInferenceClient(
      'claude-opus-5',
      anAnthropic(create),
    );

    await firstValueFrom(
      anthropicInferenceClient.chat({
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

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'call-1',
                name: 'read_file',
                input: {relativePath: 'note.txt'},
              },
            ],
          },
        ],
      }),
    );
  });

  it('sends a tool message as a tool result from the user', async () => {
    const create = vi.fn(async () => ({
      content: [{type: 'text', text: 'world'}],
      usage: {input_tokens: 3, output_tokens: 5},
    }));
    const anthropicInferenceClient = new AnthropicInferenceClient(
      'claude-opus-5',
      anAnthropic(create),
    );

    await firstValueFrom(
      anthropicInferenceClient.chat({
        system: 'be brief',
        messages: [
          {
            role: 'tool',
            toolUseId: 'call-1',
            name: 'read_file',
            content: 'file not found',
            isError: true,
          },
        ],
        tools: [],
      }),
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'call-1',
                content: 'file not found',
                is_error: true,
              },
            ],
          },
        ],
      }),
    );
  });

  it('sends the tools with their input schema', async () => {
    const create = vi.fn(async () => ({
      content: [{type: 'text', text: 'world'}],
      usage: {input_tokens: 3, output_tokens: 5},
    }));
    const anthropicInferenceClient = new AnthropicInferenceClient(
      'claude-opus-5',
      anAnthropic(create),
    );

    await firstValueFrom(
      anthropicInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [{name: 'read_file', description: 'Reads a file.', inputSchema: {type: 'object'}}],
      }),
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [{name: 'read_file', description: 'Reads a file.', input_schema: {type: 'object'}}],
      }),
    );
  });

  it('gives the tool call the model asked for', async () => {
    const anthropic = anAnthropic(async () => ({
      content: [
        {type: 'tool_use', id: 'toolu_1', name: 'read_file', input: {relativePath: 'note.txt'}},
      ],
      usage: {input_tokens: 3, output_tokens: 5},
    }));
    const anthropicInferenceClient = new AnthropicInferenceClient('claude-opus-5', anthropic);

    const response = await firstValueFrom(
      anthropicInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'read note.txt'}],
        tools: [],
      }),
    );

    expect(response.toolCall).toEqual(some({name: 'read_file', input: {relativePath: 'note.txt'}}));
  });

  it('gives no tool call when the model just answered', async () => {
    const anthropic = anAnthropic(async () => ({
      content: [{type: 'text', text: 'world'}],
      usage: {input_tokens: 3, output_tokens: 5},
    }));
    const anthropicInferenceClient = new AnthropicInferenceClient('claude-opus-5', anthropic);

    const response = await firstValueFrom(
      anthropicInferenceClient.chat({
        system: 'be brief',
        messages: [{role: 'user', content: 'hello'}],
        tools: [],
      }),
    );

    expect(response.toolCall).toEqual(none);
  });

  it('does not call the api until subscribed', () => {
    const create = vi.fn(async () => ({
      content: [{type: 'text', text: 'world'}],
      usage: {input_tokens: 3, output_tokens: 5},
    }));
    const anthropicInferenceClient = new AnthropicInferenceClient(
      'claude-opus-5',
      anAnthropic(create),
    );

    anthropicInferenceClient.chat({
      system: 'be brief',
      messages: [{role: 'user', content: 'hello'}],
      tools: [],
    });

    expect(create).not.toHaveBeenCalled();
  });
});
