import {randomUUID} from 'node:crypto';
import {of, Subject, throwError} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import type {InferenceClient} from '../inference/inference-client.ts';
import type {PatkaMessage} from '../inference/patka-message.ts';
import {isSome} from '../option.ts';
import {PatkaLogger} from '../patka-logger.ts';
import type {PatkaUtterance} from '../patka-utterance.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {DefaultPatkaPromptFactory} from './default-patka-prompt-factory.ts';
import {PatkaAgent} from './patka-agent.ts';
import type {PatkaConversation} from './patka-conversation.ts';

const anUtterance = (content: string): PatkaUtterance => ({
  content,
  timestamp: new Date(),
  id: randomUUID(),
});

const spoken = (patkaConversation: PatkaConversation): ReadonlyArray<string> =>
  patkaConversation.map((node) =>
    isSome(node.utterance) ? node.utterance.value.content : '<pending>',
  );

describe('PatkaAgent', () => {
  it('has a name', () => {
    const inferenceClient: InferenceClient = {
      generate: vi.fn(() => of({message: 'world', id: randomUUID()})),
    };

    expect(
      new PatkaAgent('patka', inferenceClient, new PatkaTools([]), new PatkaLogger()).name,
    ).toBe('patka');
  });

  describe('patkaConversation', () => {
    it('starts empty', () => {
      const patkaAgent = new PatkaAgent(
        'patka',
        {generate: vi.fn(() => of({message: 'world', id: randomUUID()}))},
        new PatkaTools([]),
        new PatkaLogger(),
      );
      const received: Array<PatkaConversation> = [];

      patkaAgent.patkaConversation.subscribe((patkaConversation) =>
        received.push(patkaConversation),
      );

      expect(received).toEqual([[]]);
    });

    it('opens an empty node for the answer before it arrives', () => {
      const answers = new Subject<PatkaMessage>();
      const patkaAgent = new PatkaAgent(
        'patka',
        {generate: () => answers},
        new PatkaTools([]),
        new PatkaLogger(),
      );
      let patkaConversation: PatkaConversation = [];
      patkaAgent.patkaConversation.subscribe((content) => {
        patkaConversation = content;
      });

      patkaAgent.handle(anUtterance('hello'));

      expect(spoken(patkaConversation)).toEqual(['hello', '<pending>']);
      expect(patkaConversation.map((node) => node.role)).toEqual(['user', 'agent']);
    });

    it('fills the node it opened, keeping its place and id', () => {
      const answers = new Subject<PatkaMessage>();
      const patkaAgent = new PatkaAgent(
        'patka',
        {generate: () => answers},
        new PatkaTools([]),
        new PatkaLogger(),
      );
      let patkaConversation: PatkaConversation = [];
      patkaAgent.patkaConversation.subscribe((content) => {
        patkaConversation = content;
      });
      patkaAgent.handle(anUtterance('hello'));
      const ids = patkaConversation.map((node) => node.id);

      answers.next({message: 'world', id: randomUUID()});

      expect(spoken(patkaConversation)).toEqual(['hello', 'world']);
      expect(patkaConversation.map((node) => node.id)).toEqual(ids);
    });

    it('keeps the whole conversation across several utterances', () => {
      const patkaAgent = new PatkaAgent(
        'patka',
        {generate: vi.fn(() => of({message: 'world', id: randomUUID()}))},
        new PatkaTools([]),
        new PatkaLogger(),
      );
      let patkaConversation: PatkaConversation = [];
      patkaAgent.patkaConversation.subscribe((content) => {
        patkaConversation = content;
      });

      patkaAgent.handle(anUtterance('first'));
      patkaAgent.handle(anUtterance('second'));

      expect(spoken(patkaConversation)).toEqual(['first', 'world', 'second', 'world']);
    });

    it('leaves the node empty when the inference client fails', () => {
      const patkaAgent = new PatkaAgent(
        'patka',
        {
          generate: () => throwError(() => new Error('ollama is down')),
        },
        new PatkaTools([]),
        new PatkaLogger(),
      );
      let patkaConversation: PatkaConversation = [];
      patkaAgent.patkaConversation.subscribe((content) => {
        patkaConversation = content;
      });

      patkaAgent.handle(anUtterance('hello'));

      expect(spoken(patkaConversation)).toEqual(['hello', '<pending>']);
    });

    it('generates from the whole conversation so far', () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({message: 'world', id: randomUUID()})),
      };
      const patkaAgent = new PatkaAgent(
        'patka',
        inferenceClient,
        new PatkaTools([]),
        new PatkaLogger(),
      );

      patkaAgent.handle(anUtterance('hello'));

      expect(inferenceClient.generate).toHaveBeenCalledWith({
        message: expect.stringContaining(['User: hello', 'Assistant:'].join('\n')),
        id: expect.any(String),
      });
    });

    it('does not generate anything on its own', () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({message: 'world', id: randomUUID()})),
      };
      new PatkaAgent('patka', inferenceClient, new PatkaTools([]), new PatkaLogger());

      expect(inferenceClient.generate).not.toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    it('logs the prompt it sends to the engine', () => {
      const patkaLogger = new PatkaLogger();
      const patkaAgent = new PatkaAgent(
        'patka',
        {generate: vi.fn(() => of({message: 'world', id: randomUUID()}))},
        new PatkaTools([]),
        patkaLogger,
      );
      const received: Array<string> = [];
      patkaLogger.logs.subscribe((line: string) => received.push(line));

      patkaAgent.handle(anUtterance('hello'));

      expect(received.map((line) => JSON.parse(line).msg)).toEqual(['patka prompts the engine']);
    });

    it('logs the whole prompt, not just the utterance', () => {
      const patkaLogger = new PatkaLogger();
      const patkaAgent = new PatkaAgent(
        'patka',
        {generate: vi.fn(() => of({message: 'world', id: randomUUID()}))},
        new PatkaTools([]),
        patkaLogger,
      );
      const received: Array<string> = [];
      patkaLogger.logs.subscribe((line: string) => received.push(line));

      patkaAgent.handle(anUtterance('hello'));

      expect(JSON.parse(received[0]).prompt).toContain('User: hello');
    });
  });
});
