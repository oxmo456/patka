import {randomUUID} from 'node:crypto';
import {EMPTY, type Observable, of, Subject, throwError} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import {none, some} from '../option/option.ts';
import type {
  PatkaAgentUtterance,
  PatkaContextEntry,
  PatkaToolOutput,
  PatkaUserUtterance,
} from '../patka-context/patka-context-entry.ts';
import type {PatkaTool} from '../patka-tool/patka-tool.ts';
import {PatkaTools} from '../patka-tool/patka-tools.ts';
import {PatkaAgent} from './patka-agent.ts';

const aTool = (name: string, output: string): PatkaTool<{path: string}, string> => ({
  name,
  llmManual: {
    name,
    input: {
      type: 'ObjectJsonSchemaLLMManual',
      title: name,
      description: '',
      properties: {},
    },
    output: {value: 'string', description: ''},
  },
  invoke: (): Observable<string> => of(output),
});

const said = (content: string): PatkaContextEntry => ({
  type: 'PatkaUserUtterance',
  timestamp: 0,
  performanceTimestamp: 0,
  root: none,
  parent: none,
  id: randomUUID(),
  utterance: {content, timestamp: new Date(), id: randomUUID()},
});

describe('PatkaAgent', () => {
  it('has a name', () => {
    const patkaAgent = new PatkaAgent(
      'patka',
      new PatkaTools([]),
      {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
      new Subject<PatkaContextEntry>(),
      {create: () => 'prompt'},
      {
        missingTools: 'missing tools',
        error: (message: string) => `error: ${message}`,
        unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
      },
    );

    expect(patkaAgent.name).toBe('patka');
  });

  describe('output', () => {
    it('says nothing until an entry reaches the agent', () => {
      const generate = vi.fn(() =>
        of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}}),
      );
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate},
        new Subject<PatkaContextEntry>(),
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );

      patkaAgent.output.subscribe();

      expect(generate).not.toHaveBeenCalled();
    });

    it('answers what the user said', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next(said('hello'));

      expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
        'PatkaInferenceClientRequest',
        'PatkaInferenceClientResponse',
      ]);
    });

    it('gives the prompt it sends in the inference client request', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'the prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next(said('hello'));

      expect(received[0]).toMatchObject({
        type: 'PatkaInferenceClientRequest',
        prompt: 'the prompt',
      });
    });

    it('gives the request as the parent of the response', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'the prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next(said('hello'));

      expect(received[1].parent).toEqual(some(received[0].id));
    });

    it('prompts the engine with the prompt the factory creates', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const generate = vi.fn(() =>
        of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}}),
      );
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate},
        patkaContextEntries,
        {create: () => 'the prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      patkaAgent.output.subscribe();

      patkaContextEntries.next(said('hello'));

      expect(generate).toHaveBeenCalledWith({prompt: 'the prompt'});
    });

    it('tells the user when the inference client fails', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => throwError(() => new Error('400 invalid_request_error'))},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next(said('hello'));

      expect(received[1]).toEqual({
        type: 'PatkaError',
        timestamp: expect.any(Number),
        performanceTimestamp: expect.any(Number),
        root: expect.anything(),
        parent: expect.anything(),
        id: expect.any(String),
        error: new Error('400 invalid_request_error'),
      });
    });

    it('turns a tool invocation into a tool call', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([aTool('read_file', 'hello')]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaInferenceClientResponse',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: randomUUID(),
        usage: {inputTokens: 0, outputTokens: 0},
        content: '$$$invoke(read_file, {"path": "a"})',
      });

      expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
        'PatkaToolCall',
      ]);
    });

    it('gives a tool output the id of its tool call as parent id', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([aTool('read_file', 'hello')]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));
      const patkaToolCallId = randomUUID();

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: patkaToolCallId,
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received[0]?.parent).toEqual(some(patkaToolCallId));
    });

    it('gives an answer what the user said as root', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));
      const patkaUserUtterance: PatkaUserUtterance = {
        type: 'PatkaUserUtterance',
        id: randomUUID(),
        timestamp: 0,
        performanceTimestamp: 0,
        root: none,
        parent: none,
        utterance: {content: 'hello', timestamp: new Date(), id: randomUUID()},
      };

      patkaContextEntries.next(patkaUserUtterance);

      expect(received[0]).toMatchObject({root: some(patkaUserUtterance.id)});
    });

    it('gives a tool output the root of its tool call', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([aTool('read_file', 'hello')]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));
      const patkaUserUtterance: PatkaUserUtterance = {
        type: 'PatkaUserUtterance',
        id: randomUUID(),
        timestamp: 0,
        performanceTimestamp: 0,
        root: none,
        parent: none,
        utterance: {content: 'hello', timestamp: new Date(), id: randomUUID()},
      };

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(patkaUserUtterance.id),
        parent: none,
        id: randomUUID(),
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received[0]).toMatchObject({root: some(patkaUserUtterance.id)});
    });

    it('tells the model when its tool invocation cannot be read', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([aTool('read_file', 'hello')]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaInferenceClientResponse',
        timestamp: 0,
        performanceTimestamp: 0,
        root: none,
        parent: none,
        id: randomUUID(),
        usage: {inputTokens: 0, outputTokens: 0},
        content: '$$$invoke(read_file, {"a": 1}) $$$invoke(read_file, {"b": 2})',
      });

      expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
        'PatkaAgentUtterance',
      ]);
    });

    it('gives the factory what the agent said', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const create = vi.fn(() => 'prompt');
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      patkaAgent.output.subscribe();
      const patkaAgentUtterance: PatkaAgentUtterance = {
        type: 'PatkaAgentUtterance',
        timestamp: 0,
        performanceTimestamp: 0,
        root: none,
        parent: none,
        id: randomUUID(),
        content: 'Patka could not read your tool invocation',
      };

      patkaContextEntries.next(patkaAgentUtterance);

      expect(create).toHaveBeenCalledWith([patkaAgentUtterance]);
    });

    it('runs the tool a tool call names', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([aTool('read_file', 'hello')]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: randomUUID(),
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
        'PatkaToolOutput',
      ]);
    });

    it('gives a tool invocation error when no tool carries that name', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: randomUUID(),
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received).toEqual([
        expect.objectContaining({
          type: 'PatkaToolInvocationError',
          error: new Error('patka has no tool named "read_file"'),
        }),
      ]);
    });

    it('gives a tool invocation error with the error of the tool when the tool fails', () => {
      const readFile: PatkaTool<{path: string}, string> = {
        name: 'read_file',
        llmManual: {
          name: 'read_file',
          input: {
            type: 'ObjectJsonSchemaLLMManual',
            title: 'read_file',
            description: '',
            properties: {},
          },
          output: {value: 'string', description: ''},
        },
        invoke: (): Observable<string> => throwError(() => new Error('file not found')),
      };
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([readFile]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: randomUUID(),
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received).toEqual([
        expect.objectContaining({
          type: 'PatkaToolInvocationError',
          error: new Error('file not found'),
        }),
      ]);
    });

    it('gives a tool empty output when the tool completes without output', () => {
      const readFile: PatkaTool<{path: string}, string> = {
        name: 'read_file',
        llmManual: {
          name: 'read_file',
          input: {
            type: 'ObjectJsonSchemaLLMManual',
            title: 'read_file',
            description: '',
            properties: {},
          },
          output: {value: 'string', description: ''},
        },
        invoke: (): Observable<string> => EMPTY,
      };
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([readFile]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: randomUUID(),
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received).toEqual([expect.objectContaining({type: 'PatkaToolEmptyOutput'})]);
    });

    it('does not ask the model after an incompetency report', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const generate = vi.fn(() =>
        of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}}),
      );
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      patkaAgent.output.subscribe();

      patkaContextEntries.next({
        type: 'PatkaToolEmptyOutput',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: randomUUID(),
        name: 'report_incompetency',
      });

      expect(generate).not.toHaveBeenCalled();
    });

    it('tells the user the agent lacks the tools after an incompetency report', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaToolEmptyOutput',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: randomUUID(),
        name: 'report_incompetency',
      });

      expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
        'PatkaUserNotification',
      ]);
    });

    it('says nothing after a notification to the user', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaUserNotification',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: randomUUID(),
        content:
          'Patka agent is not providing the necessary tools for the LLM to complete the task.',
      });

      expect(received).toEqual([]);
    });

    it('tells the user the error message after an error', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create: () => 'prompt'},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaError',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: randomUUID(),
        error: new Error('400 invalid_request_error'),
      });

      expect(received).toEqual([
        expect.objectContaining({
          type: 'PatkaUserNotification',
          content: 'error: 400 invalid_request_error',
        }),
      ]);
    });

    it('gives the factory the tool output', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const create = vi.fn(() => 'prompt');
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world', usage: {inputTokens: 0, outputTokens: 0}})},
        patkaContextEntries,
        {create},
        {
          missingTools: 'missing tools',
          error: (message: string) => `error: ${message}`,
          unreadableToolInvocation: (message: string) => `unreadable: ${message}`,
        },
      );
      patkaAgent.output.subscribe();
      const patkaToolOutput: PatkaToolOutput = {
        type: 'PatkaToolOutput',
        timestamp: 0,
        performanceTimestamp: 0,
        root: some(randomUUID()),
        parent: none,
        id: randomUUID(),
        name: 'read_file',
        output: 'hello',
      };

      patkaContextEntries.next(patkaToolOutput);

      expect(create).toHaveBeenCalledWith([patkaToolOutput]);
    });
  });
});
