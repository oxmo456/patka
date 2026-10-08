import {randomUUID} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import {some} from '../option.ts';
import {ListFiles} from '../tools/list-files/list-files.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {ReadFile} from '../tools/read-file/read-file.ts';
import {failure, success} from '../try.ts';
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
    expect(new DefaultPatkaPromptFactory(new PatkaTools([]), '/home/user').create([])).toContain(
      'fewest words possible',
    );
  });

  it('tells the model the directory where Patka runs', () => {
    expect(new DefaultPatkaPromptFactory(new PatkaTools([]), '/home/user').create([])).toContain(
      'As an agent, your working directory is: /home/user',
    );
  });

  it('asks for an answer when nothing has been said', () => {
    expect(
      new DefaultPatkaPromptFactory(new PatkaTools([]), '/home/user')
        .create([])
        .endsWith('\n\nAssistant:'),
    ).toBe(true);
  });

  it('labels who said what', () => {
    const patkaConversation = [said('hello'), answered('hi there')];

    expect(
      new DefaultPatkaPromptFactory(new PatkaTools([]), '/home/user').create(patkaConversation),
    ).toContain(['User: hello', 'Assistant: hi there', 'Assistant:'].join('\n'));
  });

  it('leaves the last cue for the model to answer', () => {
    const patkaConversation = [said('hello')];

    expect(
      new DefaultPatkaPromptFactory(new PatkaTools([]), '/home/user').create(patkaConversation),
    ).toContain(['User: hello', 'Assistant:'].join('\n'));
  });

  it('keeps the whole conversation, in order', () => {
    const patkaConversation = [
      said('my name is Zaphod'),
      answered('nice to meet you'),
      said('what is my name?'),
    ];

    expect(
      new DefaultPatkaPromptFactory(new PatkaTools([]), '/home/user').create(patkaConversation),
    ).toContain(
      [
        'User: my name is Zaphod',
        'Assistant: nice to meet you',
        'User: what is my name?',
        'Assistant:',
      ].join('\n'),
    );
  });

  it('says nothing about tools when it has none', () => {
    const prompt = new DefaultPatkaPromptFactory(new PatkaTools([]), '/home/user').create([]);

    expect(prompt).not.toContain('You can use these tools');
  });

  it('presents every tool it was given', () => {
    const defaultPatkaPromptFactory = new DefaultPatkaPromptFactory(
      new PatkaTools([new ListFiles(), new ReadFile()]),
      '/home/user',
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
      '/home/user',
    );

    const prompt = defaultPatkaPromptFactory.create([]);

    expect(prompt).toContain('"required":["relativePath"]');
    expect(prompt).toContain('"type":"string"');
  });

  it('keeps the instruction before the tools, and the conversation after', () => {
    const defaultPatkaPromptFactory = new DefaultPatkaPromptFactory(
      new PatkaTools([new ListFiles()]),
      '/home/user',
    );

    const prompt = defaultPatkaPromptFactory.create([]);

    expect(prompt.indexOf('fewest words possible')).toBeLessThan(prompt.indexOf('You can use'));
    expect(prompt.indexOf('You can use')).toBeLessThan(prompt.indexOf('Assistant:'));
  });

  it('tells the model how to ask for a tool', () => {
    const prompt = new DefaultPatkaPromptFactory(
      new PatkaTools([new ReadFile()]),
      '/home/user',
    ).create([]);

    expect(prompt).toContain('single line');
    expect(prompt).toContain('$$$invoke(tool_name, {"key": "value"})');
    expect(prompt).toContain('$$$invoke(read_file, {"relativePath": "notes.txt"})');
  });

  it('gives the model the success and failure form of each tool output', () => {
    const prompt = new DefaultPatkaPromptFactory(
      new PatkaTools([new ReadFile()]),
      '/home/user',
    ).create([]);

    expect(prompt).toContain('"type":{"const":"failure"}');
  });

  it('shows the success output a tool gave back', () => {
    const patkaToolResult: PatkaContextEntry = {
      type: 'PatkaToolOutput',
      id: randomUUID(),
      name: 'read_file',
      output: success(some('hello')),
    };

    const prompt = new DefaultPatkaPromptFactory(new PatkaTools([]), '/home/user').create([
      patkaToolResult,
    ]);

    expect(prompt).toContain(
      'Tool output: {"type":"success","value":{"type":"some","value":"hello"}}',
    );
  });

  it('shows the failure output a tool gave back', () => {
    const patkaToolResult: PatkaContextEntry = {
      type: 'PatkaToolOutput',
      id: randomUUID(),
      name: 'read_file',
      output: failure(new Error('file not found')),
    };

    const prompt = new DefaultPatkaPromptFactory(new PatkaTools([]), '/home/user').create([
      patkaToolResult,
    ]);

    expect(prompt).toContain('Tool output: {"type":"failure","error":"file not found"}');
  });
});
