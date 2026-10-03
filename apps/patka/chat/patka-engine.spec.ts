import {randomUUID} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {PatkaContext} from '../context/patka-context.ts';
import {some} from '../option.ts';
import type {PatkaChatEntry} from './patka-chat-entry.ts';
import {PatkaEngine} from './patka-engine.ts';

describe('PatkaEngine', () => {
  describe('patkaChatEntries', () => {
    it('starts empty', () => {
      const patkaEngine = new PatkaEngine(new PatkaContext(), 'patka');
      const received: Array<ReadonlyArray<PatkaChatEntry>> = [];

      patkaEngine.patkaChatEntries.subscribe((entries) => received.push(entries));

      expect(received).toEqual([[]]);
    });

    it('shows what the user said', () => {
      const patkaContext = new PatkaContext();
      const patkaEngine = new PatkaEngine(patkaContext, 'patka');
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaContext.append({
        type: 'PatkaUserUtterance',
        id: randomUUID(),
        utterance: {content: 'hello', timestamp: new Date(), id: randomUUID()},
      });

      expect(patkaChatEntries.map((entry) => entry.message)).toEqual(['hello']);
    });

    it('names the user as the author of what the user said', () => {
      const patkaContext = new PatkaContext();
      const patkaEngine = new PatkaEngine(patkaContext, 'patka');
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaContext.append({
        type: 'PatkaUserUtterance',
        id: randomUUID(),
        utterance: {content: 'hello', timestamp: new Date(), id: randomUUID()},
      });

      expect(patkaChatEntries.map((entry) => entry.author)).toEqual(['you']);
    });

    it('names the agent as the author of a reply', () => {
      const patkaContext = new PatkaContext();
      const patkaEngine = new PatkaEngine(patkaContext, 'patka');
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaContext.append({
        type: 'PatkaInferenceClientResponse',
        id: randomUUID(),
        content: 'world',
      });

      expect(patkaChatEntries.map((entry) => entry.author)).toEqual(['patka']);
    });

    it('keeps a tool call out of the chat', () => {
      const patkaContext = new PatkaContext();
      const patkaEngine = new PatkaEngine(patkaContext, 'patka');
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaContext.append({
        type: 'PatkaToolCall',
        id: randomUUID(),
        name: 'read_file',
        input: {path: 'note.txt'},
      });

      expect(patkaChatEntries).toEqual([]);
    });

    it('keeps a tool result out of the chat', () => {
      const patkaContext = new PatkaContext();
      const patkaEngine = new PatkaEngine(patkaContext, 'patka');
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaContext.append({
        type: 'PatkaToolResult',
        id: randomUUID(),
        name: 'read_file',
        output: some('hello'),
      });

      expect(patkaChatEntries).toEqual([]);
    });

    it('keeps a reply that invokes a tool out of the chat', () => {
      const patkaContext = new PatkaContext();
      const patkaEngine = new PatkaEngine(patkaContext, 'patka');
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaContext.append({
        type: 'PatkaInferenceClientResponse',
        id: randomUUID(),
        content: '$$$invoke(read_file, {"path": "note.txt"})',
      });

      expect(patkaChatEntries).toEqual([]);
    });

    it('shows a notification to the user as an agent message', () => {
      const patkaContext = new PatkaContext();
      const patkaEngine = new PatkaEngine(patkaContext, 'patka');
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaContext.append({
        type: 'PatkaUserNotification',
        id: randomUUID(),
        content:
          'Patka agent is not providing the necessary tools for the LLM to complete the task.',
      });

      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.message)).toEqual([
        'Patka agent is not providing the necessary tools for the LLM to complete the task.',
      ]);
    });

    it('shows an error as a failed agent message', () => {
      const patkaContext = new PatkaContext();
      const patkaEngine = new PatkaEngine(patkaContext, 'patka');
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaContext.append({
        type: 'PatkaError',
        id: randomUUID(),
        error: new Error('400 invalid_request_error'),
      });

      expect(patkaChatEntries).toEqual([
        {
          id: expect.any(String),
          role: 'agent',
          author: 'patka',
          message: 'oops! something went wrong :/',
          status: 'failed',
        },
      ]);
    });

    it('stacks the entries in the order they reach the context', () => {
      const patkaContext = new PatkaContext();
      const patkaEngine = new PatkaEngine(patkaContext, 'patka');
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaContext.append({
        type: 'PatkaUserUtterance',
        id: randomUUID(),
        utterance: {content: 'hello', timestamp: new Date(), id: randomUUID()},
      });
      patkaContext.append({
        type: 'PatkaInferenceClientResponse',
        id: randomUUID(),
        content: 'world',
      });

      expect(patkaChatEntries.map((entry) => entry.role)).toEqual(['user', 'agent']);
    });
  });
});
