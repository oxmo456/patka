import {randomUUID} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import {ListFiles} from '../tools/list-files.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {ReadFile} from '../tools/read-file.ts';
import {DefaultPatkaPromptFactory} from './default-patka-prompt-factory.ts';

const said = (content: string): PatkaContextEntry => ({
  type: 'PatkaUserUtterance',
  id: randomUUID(),
  utterance: {content, timestamp: new Date(), id: randomUUID()},
});

const answered = (content: string): PatkaContextEntry => ({
  type: 'PatkaInferenceClientResponse',
  id: randomUUID(),
  content,
});

describe('DefaultPatkaPromptFactory', () => {
  it('tells the model to keep its answer short', () => {
    expect(new DefaultPatkaPromptFactory(new PatkaTools([])).create([])).toContain(
      'fewest words possible',
    );
  });

  it('asks for an answer when nothing has been said', () => {
    expect(
      new DefaultPatkaPromptFactory(new PatkaTools([])).create([]).endsWith('\n\nAssistant:'),
    ).toBe(true);
  });

  it('labels who said what', () => {
    const patkaConversation = [said('hello'), answered('hi there')];

    expect(new DefaultPatkaPromptFactory(new PatkaTools([])).create(patkaConversation)).toContain(
      ['User: hello', 'Assistant: hi there', 'Assistant:'].join('\n'),
    );
  });

  it('leaves the last cue for the model to answer', () => {
    const patkaConversation = [said('hello')];

    expect(new DefaultPatkaPromptFactory(new PatkaTools([])).create(patkaConversation)).toContain(
      ['User: hello', 'Assistant:'].join('\n'),
    );
  });

  it('keeps the whole conversation, in order', () => {
    const patkaConversation = [
      said('my name is Zaphod'),
      answered('nice to meet you'),
      said('what is my name?'),
    ];

    expect(new DefaultPatkaPromptFactory(new PatkaTools([])).create(patkaConversation)).toContain(
      [
        'User: my name is Zaphod',
        'Assistant: nice to meet you',
        'User: what is my name?',
        'Assistant:',
      ].join('\n'),
    );
  });

  it('says nothing about tools when it has none', () => {
    const prompt = new DefaultPatkaPromptFactory(new PatkaTools([])).create([]);

    expect(prompt).not.toContain('You can use these tools');
  });

  it('presents every tool it was given', () => {
    const defaultPatkaPromptFactory = new DefaultPatkaPromptFactory(
      new PatkaTools([new ListFiles(), new ReadFile()]),
    );

    const prompt = defaultPatkaPromptFactory.create([]);

    expect(prompt).toContain('You can use these tools:');
    expect(prompt).toContain('- list_files: Lists the files');
    expect(prompt).toContain('- read_file: Reads');
    expect(prompt).toContain('usage: Use it');
  });

  it('gives the model each tool input and output schema', () => {
    const defaultPatkaPromptFactory = new DefaultPatkaPromptFactory(
      new PatkaTools([new ReadFile()]),
    );

    const prompt = defaultPatkaPromptFactory.create([]);

    expect(prompt).toContain('"required":["path"]');
    expect(prompt).toContain('"type":"string"');
  });

  it('keeps the instruction before the tools, and the conversation after', () => {
    const defaultPatkaPromptFactory = new DefaultPatkaPromptFactory(
      new PatkaTools([new ListFiles()]),
    );

    const prompt = defaultPatkaPromptFactory.create([]);

    expect(prompt.indexOf('fewest words possible')).toBeLessThan(prompt.indexOf('You can use'));
    expect(prompt.indexOf('You can use')).toBeLessThan(prompt.indexOf('Assistant:'));
  });

  it('tells the model how to ask for a tool', () => {
    const prompt = new DefaultPatkaPromptFactory(new PatkaTools([new ReadFile()])).create([]);

    expect(prompt).toContain('single line');
    expect(prompt).toContain('$$$invoke(tool_name, {"key": "value"})');
    expect(prompt).toContain('$$$invoke(read_file, {"path": "notes.txt"})');
  });
});
