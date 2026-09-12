import {randomUUID} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {PatkaChat} from './patka-chat.ts';
import type {PatkaChatEntry} from './patka-chat-entry.ts';

const anEntry = (message: string, id = randomUUID()): PatkaChatEntry => ({
  id,
  role: 'user',
  author: 'you',
  message,
  status: 'complete',
});

describe('PatkaChat', () => {
  describe('push', () => {
    it('appends an entry the chat does not know yet', () => {
      const patkaChat = new PatkaChat();
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaChat.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaChat.push(anEntry('hello'));
      patkaChat.push(anEntry('world'));

      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.message)).toEqual([
        'hello',
        'world',
      ]);
    });

    it('replaces the entry that already has that id, keeping its place', () => {
      const patkaChat = new PatkaChat();
      const id = randomUUID();
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaChat.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });
      patkaChat.push({id, role: 'agent', author: 'patka', message: '', status: 'pending'});
      patkaChat.push(anEntry('later'));

      patkaChat.push({
        id,
        role: 'agent',
        author: 'patka',
        message: 'the answer',
        status: 'complete',
      });

      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.message)).toEqual([
        'the answer',
        'later',
      ]);
      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.status)).toEqual([
        'complete',
        'complete',
      ]);
    });
  });

  describe('patkaChatEntries', () => {
    it('starts empty', () => {
      const patkaChat = new PatkaChat();
      const received: Array<ReadonlyArray<PatkaChatEntry>> = [];

      patkaChat.patkaChatEntries.subscribe((patkaChatEntries) => received.push(patkaChatEntries));

      expect(received).toEqual([[]]);
    });

    it('emits again when an entry is replaced', () => {
      const patkaChat = new PatkaChat();
      const id = randomUUID();
      patkaChat.push({id, role: 'agent', author: 'patka', message: '', status: 'pending'});
      const received: Array<string> = [];
      patkaChat.patkaChatEntries.subscribe((patkaChatEntries) =>
        received.push(patkaChatEntries[0].status),
      );

      patkaChat.push({
        id,
        role: 'agent',
        author: 'patka',
        message: 'the answer',
        status: 'complete',
      });

      expect(received).toEqual(['pending', 'complete']);
    });

    it('gives a late subscriber the entries so far', () => {
      const patkaChat = new PatkaChat();
      patkaChat.push(anEntry('hello'));
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];

      patkaChat.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.message)).toEqual(['hello']);
    });
  });
});
