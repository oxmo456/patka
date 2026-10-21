import {randomUUID} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {none, some} from '../option/option.ts';
import {createInferenceMessagesFromPatkaContextEntries} from './inference-messages.ts';

describe('createInferenceMessagesFromPatkaContextEntries', () => {
  it('gives no message for an empty context', () => {
    expect(createInferenceMessagesFromPatkaContextEntries([])).toEqual([]);
  });

  it('turns what the user said into a user message', () => {
    expect(
      createInferenceMessagesFromPatkaContextEntries([
        {
          type: 'PatkaUserUtterance',
          id: randomUUID(),
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: none,
          utterance: {content: 'hello', timestamp: new Date(), id: randomUUID()},
        },
      ]),
    ).toEqual([{role: 'user', content: 'hello'}]);
  });

  it('turns an answer of the model into an assistant message', () => {
    expect(
      createInferenceMessagesFromPatkaContextEntries([
        {
          type: 'PatkaInferenceClientResponse',
          id: randomUUID(),
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: none,
          content: 'hi there',
          toolCall: none,
          usage: {inputTokens: 0, outputTokens: 0},
        },
      ]),
    ).toEqual([{role: 'assistant', content: 'hi there', toolUse: none}]);
  });

  it('leaves out an answer of the model that calls a tool', () => {
    expect(
      createInferenceMessagesFromPatkaContextEntries([
        {
          type: 'PatkaInferenceClientResponse',
          id: randomUUID(),
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: none,
          content: '',
          toolCall: some({name: 'read_file', input: {relativePath: 'note.txt'}}),
          usage: {inputTokens: 0, outputTokens: 0},
        },
      ]),
    ).toEqual([]);
  });

  it('turns a tool call into an assistant message that uses the tool', () => {
    const patkaToolCallId = randomUUID();

    expect(
      createInferenceMessagesFromPatkaContextEntries([
        {
          type: 'PatkaToolCall',
          id: patkaToolCallId,
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: none,
          name: 'read_file',
          input: {relativePath: 'note.txt'},
        },
      ]),
    ).toEqual([
      {
        role: 'assistant',
        content: '',
        toolUse: some({id: patkaToolCallId, name: 'read_file', input: {relativePath: 'note.txt'}}),
      },
    ]);
  });

  it('turns a tool output into a tool message for its tool call', () => {
    const patkaToolCallId = randomUUID();

    expect(
      createInferenceMessagesFromPatkaContextEntries([
        {
          type: 'PatkaToolOutput',
          id: randomUUID(),
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: some(patkaToolCallId),
          name: 'read_file',
          output: 'hello',
        },
      ]),
    ).toEqual([
      {
        role: 'tool',
        toolUseId: patkaToolCallId,
        name: 'read_file',
        content: '"hello"',
        isError: false,
      },
    ]);
  });

  it('turns a tool empty output into a tool message that says it is done', () => {
    const patkaToolCallId = randomUUID();

    expect(
      createInferenceMessagesFromPatkaContextEntries([
        {
          type: 'PatkaToolEmptyOutput',
          id: randomUUID(),
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: some(patkaToolCallId),
          name: 'report_incompetency',
        },
      ]),
    ).toEqual([
      {
        role: 'tool',
        toolUseId: patkaToolCallId,
        name: 'report_incompetency',
        content: 'Done. The tool has no output.',
        isError: false,
      },
    ]);
  });

  it('turns a tool invocation error into a tool message that is an error', () => {
    const patkaToolCallId = randomUUID();

    expect(
      createInferenceMessagesFromPatkaContextEntries([
        {
          type: 'PatkaToolInvocationError',
          id: randomUUID(),
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: some(patkaToolCallId),
          name: 'read_file',
          error: new Error('file not found'),
        },
      ]),
    ).toEqual([
      {
        role: 'tool',
        toolUseId: patkaToolCallId,
        name: 'read_file',
        content: 'file not found',
        isError: true,
      },
    ]);
  });

  it('leaves out a notification to the user', () => {
    expect(
      createInferenceMessagesFromPatkaContextEntries([
        {
          type: 'PatkaUserNotification',
          id: randomUUID(),
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: none,
          content: 'missing tools',
        },
      ]),
    ).toEqual([]);
  });

  it('keeps the messages in the order of the context', () => {
    expect(
      createInferenceMessagesFromPatkaContextEntries([
        {
          type: 'PatkaUserUtterance',
          id: randomUUID(),
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: none,
          utterance: {content: 'my name is Zaphod', timestamp: new Date(), id: randomUUID()},
        },
        {
          type: 'PatkaInferenceClientResponse',
          id: randomUUID(),
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: none,
          content: 'nice to meet you',
          toolCall: none,
          usage: {inputTokens: 0, outputTokens: 0},
        },
        {
          type: 'PatkaUserUtterance',
          id: randomUUID(),
          timestamp: 0,
          performanceTimestamp: 0,
          root: none,
          parent: none,
          utterance: {content: 'what is my name?', timestamp: new Date(), id: randomUUID()},
        },
      ]).map((inferenceMessage) => inferenceMessage.content),
    ).toEqual(['my name is Zaphod', 'nice to meet you', 'what is my name?']);
  });
});
