import {randomUUID} from 'node:crypto';
import {type Observable, of, Subject, throwError} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import type {PatkaMessage} from '../inference/patka-message.ts';
import type {PatkaTool} from '../tools/patka-tool.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {PatkaAgent} from './patka-agent.ts';

const aTool = (name: string, output: string): PatkaTool<{path: string}, string> => ({
  manual: {
    name,
    summary: `summary of ${name}`,
    usage: `usage of ${name}`,
    input: {type: 'object', properties: {}, required: []},
    output: {type: 'string'},
  },
  invoke: (): Observable<string> => of(output),
});

const said = (content: string): PatkaContextEntry => ({
  type: 'PatkaUserUtterance',
  id: randomUUID(),
  utterance: {content, timestamp: new Date(), id: randomUUID()},
});

describe('PatkaAgent', () => {
  it('has a name', () => {
    const patkaAgent = new PatkaAgent(
      'patka',
      new PatkaTools([]),
      {generate: () => of({message: 'world', id: randomUUID()})},
      new Subject<PatkaContextEntry>(),
    );

    expect(patkaAgent.name).toBe('patka');
  });

  describe('output', () => {
    it('says nothing until an entry reaches the agent', () => {
      const generate = vi.fn(() => of({message: 'world', id: randomUUID()}));
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate},
        new Subject<PatkaContextEntry>(),
      );

      patkaAgent.output.subscribe();

      expect(generate).not.toHaveBeenCalled();
    });

    it('answers what the user said', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({message: 'world', id: randomUUID()})},
        patkaContextEntries,
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next(said('hello'));

      expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual(['PatkaReply']);
    });

    it('prompts the engine with what the user said', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const generate = vi.fn(() => of({message: 'world', id: randomUUID()}));
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate},
        patkaContextEntries,
      );
      patkaAgent.output.subscribe();

      patkaContextEntries.next(said('hello'));

      expect(generate).toHaveBeenCalledWith({
        message: expect.stringContaining('User: hello'),
        id: expect.any(String),
      });
    });

    it('says nothing when the engine fails', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => throwError(() => new Error('ollama is down'))},
        patkaContextEntries,
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next(said('hello'));

      expect(received).toEqual([]);
    });

    it('turns a tool invocation into a tool call', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([aTool('read_file', 'hello')]),
        {generate: () => of({message: 'world', id: randomUUID()})},
        patkaContextEntries,
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaReply',
        id: randomUUID(),
        content: '$$$invoke(read_file, {"path": "a"})',
      });

      expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
        'PatkaToolCall',
      ]);
    });

    it('runs the tool a tool call names', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([aTool('read_file', 'hello')]),
        {generate: () => of({message: 'world', id: randomUUID()})},
        patkaContextEntries,
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        id: randomUUID(),
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received.map((patkaContextEntry) => patkaContextEntry.type)).toEqual([
        'PatkaToolResult',
      ]);
    });

    it('says nothing when no tool carries that name', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {generate: () => of({message: 'world', id: randomUUID()})},
        patkaContextEntries,
      );
      const received: Array<PatkaContextEntry> = [];
      patkaAgent.output.subscribe((patkaContextEntry) => received.push(patkaContextEntry));

      patkaContextEntries.next({
        type: 'PatkaToolCall',
        id: randomUUID(),
        name: 'read_file',
        input: {path: 'a'},
      });

      expect(received).toEqual([]);
    });

    it('carries the tool output into the next prompt', () => {
      const patkaContextEntries = new Subject<PatkaContextEntry>();
      const prompts: Array<string> = [];
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        {
          generate: (patkaMessage: PatkaMessage) => {
            prompts.push(patkaMessage.message);

            return of({message: 'the note says hello', id: randomUUID()});
          },
        },
        patkaContextEntries,
      );
      patkaAgent.output.subscribe();

      patkaContextEntries.next({
        type: 'PatkaToolResult',
        id: randomUUID(),
        name: 'read_file',
        output: 'hello',
      });

      expect(prompts[0]).toContain('Tool output: "hello"');
    });
  });
});
