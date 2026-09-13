import {randomUUID} from 'node:crypto';
import {of, Subject} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import {DefaultPatkaPromptFactory} from '../agent/default-patka-prompt-factory.ts';
import {PatkaAgent} from '../agent/patka-agent.ts';
import type {PatkaMessage} from '../inference/patka-message.ts';
import {PatkaLogger} from '../patka-logger.ts';
import type {PatkaUtterance} from '../patka-utterance.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import type {PatkaChatEntry} from './patka-chat-entry.ts';
import {PatkaEngine} from './patka-engine.ts';

const anUtterance = (content: string): PatkaUtterance => ({
  content,
  timestamp: new Date(),
  id: randomUUID(),
});

describe('PatkaEngine', () => {
  describe('patkaChatEntries', () => {
    it('starts empty', () => {
      const patkaEngine = new PatkaEngine(
        new PatkaAgent(
          'patka',
          {
            generate: vi.fn(() => of({message: 'world', id: randomUUID()})),
          },
          new PatkaTools([]),
          new PatkaLogger(),
        ),
      );
      const received: Array<ReadonlyArray<PatkaChatEntry>> = [];

      patkaEngine.patkaChatEntries.subscribe((patkaChatEntries) => received.push(patkaChatEntries));

      expect(received).toEqual([[]]);
    });

    it('holds the utterance and the answer, in the order they happened', () => {
      const patkaEngine = new PatkaEngine(
        new PatkaAgent(
          'patka',
          {
            generate: vi.fn(() => of({message: 'world', id: randomUUID()})),
          },
          new PatkaTools([]),
          new PatkaLogger(),
        ),
      );
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaEngine.handle(anUtterance('hello'));

      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.message)).toEqual([
        'hello',
        'world',
      ]);
    });

    it('names the author and role of every entry', () => {
      const patkaEngine = new PatkaEngine(
        new PatkaAgent(
          'patka',
          {
            generate: vi.fn(() => of({message: 'world', id: randomUUID()})),
          },
          new PatkaTools([]),
          new PatkaLogger(),
        ),
      );
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaEngine.handle(anUtterance('hello'));

      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.author)).toEqual([
        'you',
        'patka',
      ]);
      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.role)).toEqual([
        'user',
        'agent',
      ]);
    });

    it('keeps the answer pending until it arrives', () => {
      const answers = new Subject<PatkaMessage>();
      const patkaEngine = new PatkaEngine(
        new PatkaAgent('patka', {generate: () => answers}, new PatkaTools([]), new PatkaLogger()),
      );
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaEngine.handle(anUtterance('hello'));

      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.status)).toEqual([
        'complete',
        'pending',
      ]);

      answers.next({message: 'world', id: randomUUID()});

      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.status)).toEqual([
        'complete',
        'complete',
      ]);
      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.message)).toEqual([
        'hello',
        'world',
      ]);
    });

    it('gives every utterance its own answer, even when they overlap', () => {
      const answers: Array<Subject<PatkaMessage>> = [];
      const patkaEngine = new PatkaEngine(
        new PatkaAgent(
          'patka',
          {
            generate: () => {
              const answer = new Subject<PatkaMessage>();
              answers.push(answer);
              return answer;
            },
          },
          new PatkaTools([]),
          new PatkaLogger(),
        ),
      );
      let patkaChatEntries: ReadonlyArray<PatkaChatEntry> = [];
      patkaEngine.patkaChatEntries.subscribe((content) => {
        patkaChatEntries = content;
      });

      patkaEngine.handle(anUtterance('first'));
      patkaEngine.handle(anUtterance('second'));
      answers[0].next({message: 'answer one', id: randomUUID()});
      answers[1].next({message: 'answer two', id: randomUUID()});

      expect(patkaChatEntries.map((patkaChatEntry) => patkaChatEntry.message)).toEqual([
        'first',
        'answer one',
        'second',
        'answer two',
      ]);
    });
  });
});
