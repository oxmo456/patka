import {randomUUID} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {PatkaContext} from '../context/patka-context.ts';
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

    it('says which tool runs', () => {
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

      expect(patkaChatEntries[0].message).toBe('read_file');
    });

    it('says which tool gave back its output', () => {
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
        output: 'hello',
      });

      expect(patkaChatEntries[0].message).toBe('read_file done');
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
