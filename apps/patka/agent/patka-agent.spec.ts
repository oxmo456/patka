import {randomUUID} from 'node:crypto';
import {type Observable, of, Subject, throwError} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import type {InferenceClientInput} from '../inference/inference-client-input.ts';
import {none, type Option, some} from '../option.ts';
import type {PatkaTool} from '../tools/patka-tool.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {success, type Try} from '../try.ts';
import {PatkaAgent} from './patka-agent.ts';

const aTool = (name: string, output: string): PatkaTool<{path: string}, string> => ({
  manual: {
    name,
    summary: `summary of ${name}`,
    usage: `usage of ${name}`,
    input: {type: 'object', properties: {}, required: []},
    output: {type: 'string'},
  },
  invoke: (): Observable<Try<Option<string>>> => of(success(some(output))),
});

const said = (content: string): PatkaContextEntry => ({
  type: 'PatkaUserUtterance',
  timestamp: 0,
  performanceTimestamp: 0,
  origin: none,
  id: randomUUID(),
  utterance: {content, timestamp: new Date(), id: randomUUID()},
});

describe('PatkaAgent', () => {
  it('has a name', () => {
    const patkaAgent = new PatkaAgent(
      'patka',
      new PatkaTools([]),
      {generate: () => of({content: 'world'})},
      new Subject<PatkaContextEntry>(),
      '/home/user',
    );

    expect(patkaAgent.name).toBe('patka');
  });

  describe('output', () => {
    it('says nothing until an entry reaches the agent', () => {
      const generate = vi.fn(() => of({content: 'world'}));
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate},
        new Subject<PatkaContextEntry>(),
        '/home/user',
      );

      patkaAgent.output.subscribe();

      expect(generate).not.toHaveBeenCalled();
    });

    it('answers what the user said', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world'})},
        patkaContextEntries,
        '/home/user',
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next(said('hello'));

      expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
        'PatkaInferenceClientResponse',
      ]);
    });

    it('prompts the engine with what the user said', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const generate = vi.fn(() => of({content: 'world'}));
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate},
        patkaContextEntries,
        '/home/user',
      );
      patkaAgent.output.subscribe();

      patkaContextEntries.next(said('hello'));

      expect(generate).toHaveBeenCalledWith({prompt: expect.stringContaining('User: hello')});
    });

    it('tells the user when the inference client fails', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => throwError(() => new Error('400 invalid_request_error'))},
        patkaContextEntries,
        '/home/user',
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next(said('hello'));

      expect(received).toEqual([
        {
          type: 'PatkaError',
          timestamp: expect.any(Number),
          performanceTimestamp: expect.any(Number),
          origin: expect.anything(),
          id: expect.any(String),
          error: new Error('400 invalid_request_error'),
        },
      ]);
    });

    it('turns a tool invocation into a tool call', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([aTool('read_file', 'hello')]),
        {generate: () => of({content: 'world'})},
        patkaContextEntries,
        '/home/user',
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaInferenceClientResponse',
        timestamp: 0,
        performanceTimestamp: 0,
        origin: none,
        id: randomUUID(),
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
        {generate: () => of({content: 'world'})},
        patkaContextEntries,
        '/home/user',
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));
      const patkaToolCallId = randomUUID();

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        timestamp: 0,
        performanceTimestamp: 0,
        origin: none,
        id: patkaToolCallId,
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received[0]?.origin).toEqual(
        some({parentId: patkaToolCallId, durationSinceParent: expect.any(Number)}),
      );
    });

    it('runs the tool a tool call names', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([aTool('read_file', 'hello')]),
        {generate: () => of({content: 'world'})},
        patkaContextEntries,
        '/home/user',
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        timestamp: 0,
        performanceTimestamp: 0,
        origin: none,
        id: randomUUID(),
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
        'PatkaToolOutput',
      ]);
    });

    it('gives a failure result when no tool carries that name', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world'})},
        patkaContextEntries,
        '/home/user',
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        timestamp: 0,
        performanceTimestamp: 0,
        origin: none,
        id: randomUUID(),
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received).toEqual([
        expect.objectContaining({
          type: 'PatkaToolOutput',
          output: {type: 'failure', error: new Error('patka has no tool named "read_file"')},
        }),
      ]);
    });

    it('does not ask the model after an incompetency report', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const generate = vi.fn(() => of({content: 'world'}));
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate},
        patkaContextEntries,
        '/home/user',
      );
      patkaAgent.output.subscribe();

      patkaContextEntries.next({
        type: 'PatkaToolOutput',
        timestamp: 0,
        performanceTimestamp: 0,
        origin: none,
        id: randomUUID(),
        name: 'report_incompetency',
        output: success(none),
      });

      expect(generate).not.toHaveBeenCalled();
    });

    it('tells the user the agent lacks the tools after an incompetency report', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({content: 'world'})},
        patkaContextEntries,
        '/home/user',
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaToolOutput',
        timestamp: 0,
        performanceTimestamp: 0,
        origin: none,
        id: randomUUID(),
        name: 'report_incompetency',
        output: success(none),
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
        {generate: () => of({content: 'world'})},
        patkaContextEntries,
        '/home/user',
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaUserNotification',
        timestamp: 0,
        performanceTimestamp: 0,
        origin: none,
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
        {generate: () => of({content: 'world'})},
        patkaContextEntries,
        '/home/user',
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaError',
        timestamp: 0,
        performanceTimestamp: 0,
        origin: none,
        id: randomUUID(),
        error: new Error('400 invalid_request_error'),
      });

      expect(received).toEqual([
        expect.objectContaining({
          type: 'PatkaUserNotification',
          content: 'Oops something went wrong... 400 invalid_request_error',
        }),
      ]);
    });

    it('carries the tool output into the next prompt', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const prompts: Array<string> = [];
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {
          generate: (inferenceClientInput: InferenceClientInput) => {
            prompts.push(inferenceClientInput.prompt);

            return of({content: 'the note says hello'});
          },
        },
        patkaContextEntries,
        '/home/user',
      );
      patkaAgent.output.subscribe();

      patkaContextEntries.next({
        type: 'PatkaToolOutput',
        timestamp: 0,
        performanceTimestamp: 0,
        origin: none,
        id: randomUUID(),
        name: 'read_file',
        output: success(some('hello')),
      });

      expect(prompts[0]).toContain(
        'Tool output: {"type":"success","value":{"type":"some","value":"hello"}}',
      );
    });
  });
});
