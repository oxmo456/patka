import {randomUUID} from 'node:crypto';
import {of, Subject, throwError} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import type {InferenceClient} from '../inference/inference-client.ts';
import type {PatkaMessage} from '../inference/patka-message.ts';
import {isSome} from '../option.ts';
import {PatkaLogger} from '../patka-logger.ts';
import type {PatkaUtterance} from '../patka-utterance.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {PatkaAgent} from './patka-agent.ts';
import {PatkaAgentLoop} from './patka-agent-loop.ts';
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
    const patkaAgent = new PatkaAgent(
      'patka',
      new PatkaTools([]),
      new PatkaAgentLoop(
        'patka',
        {generate: vi.fn(() => of({message: 'world', id: randomUUID()}))},
        new PatkaTools([]),
        new PatkaLogger(),
      ),
    );

    expect(patkaAgent.name).toBe('patka');
  });

  describe('patkaConversation', () => {
    it('starts empty', () => {
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        new PatkaAgentLoop(
          'patka',
          {generate: vi.fn(() => of({message: 'world', id: randomUUID()}))},
          new PatkaTools([]),
          new PatkaLogger(),
        ),
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
        new PatkaTools([]),
        new PatkaAgentLoop(
          'patka',
          {generate: () => answers},
          new PatkaTools([]),
          new PatkaLogger(),
        ),
      );
      let patkaConversation: PatkaConversation = [];
      patkaAgent.patkaConversation.subscribe((content) => {
        patkaConversation = content;
      });

      patkaAgent.handle(anUtterance('hello'));

      expect(spoken(patkaConversation)).toEqual(['hello', '<pending>']);
    });

    it('names who said what', () => {
      const answers = new Subject<PatkaMessage>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        new PatkaAgentLoop(
          'patka',
          {generate: () => answers},
          new PatkaTools([]),
          new PatkaLogger(),
        ),
      );
      let patkaConversation: PatkaConversation = [];
      patkaAgent.patkaConversation.subscribe((content) => {
        patkaConversation = content;
      });

      patkaAgent.handle(anUtterance('hello'));

      expect(patkaConversation.map((node) => node.role)).toEqual(['user', 'agent']);
    });

    it('fills the node it opened, keeping its place', () => {
      const answers = new Subject<PatkaMessage>();
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        new PatkaAgentLoop(
          'patka',
          {generate: () => answers},
          new PatkaTools([]),
          new PatkaLogger(),
        ),
      );
      let patkaConversation: PatkaConversation = [];
      patkaAgent.patkaConversation.subscribe((content) => {
        patkaConversation = content;
      });
      patkaAgent.handle(anUtterance('hello'));

      answers.next({message: 'world', id: randomUUID()});

      expect(spoken(patkaConversation)).toEqual(['hello', 'world']);
    });

    it('keeps the whole conversation across several utterances', () => {
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        new PatkaAgentLoop(
          'patka',
          {generate: vi.fn(() => of({message: 'world', id: randomUUID()}))},
          new PatkaTools([]),
          new PatkaLogger(),
        ),
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
        new PatkaTools([]),
        new PatkaAgentLoop(
          'patka',
          {generate: () => throwError(() => new Error('ollama is down'))},
          new PatkaTools([]),
          new PatkaLogger(),
        ),
      );
      let patkaConversation: PatkaConversation = [];
      patkaAgent.patkaConversation.subscribe((content) => {
        patkaConversation = content;
      });

      patkaAgent.handle(anUtterance('hello'));

      expect(spoken(patkaConversation)).toEqual(['hello', '<pending>']);
    });

    it('prompts the loop with the whole conversation so far', () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({message: 'world', id: randomUUID()})),
      };
      const patkaAgent = new PatkaAgent(
        'patka',
        new PatkaTools([]),
        new PatkaAgentLoop('patka', inferenceClient, new PatkaTools([]), new PatkaLogger()),
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

      new PatkaAgent(
        'patka',
        new PatkaTools([]),
        new PatkaAgentLoop('patka', inferenceClient, new PatkaTools([]), new PatkaLogger()),
      );

      expect(inferenceClient.generate).not.toHaveBeenCalled();
    });
  });
});
