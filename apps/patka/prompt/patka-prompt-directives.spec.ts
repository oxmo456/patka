import {randomUUID} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {none, some} from '../../../packages/option/option.ts';
import type {PatkaContextEntry} from '../../../packages/patka-agent/context/patka-context-entry.ts';
import {PatkaTools} from '../../../packages/patka-agent/tools/patka-tools.ts';
import {DefaultPatkaPromptFactory} from '../../../packages/patka-prompt/default-patka-prompt-factory.ts';
import {failure, success} from '../../../packages/try/try.ts';
import {ListFiles} from '../tools/list-files/list-files.ts';
import {ReadFile} from '../tools/read-file/read-file.ts';
import {createPatkaPromptDirective} from './patka-prompt-directives.ts';

const said = (content: string): PatkaContextEntry => ({
  type: 'PatkaUserUtterance',
  timestamp: 0,
  performanceTimestamp: 0,
  root: none,
  parent: none,
  id: randomUUID(),
  utterance: {content, timestamp: new Date(), id: randomUUID()},
});

const answered = (content: string): PatkaContextEntry => ({
  type: 'PatkaInferenceClientResponse',
  timestamp: 0,
  performanceTimestamp: 0,
  root: some(randomUUID()),
  parent: none,
  id: randomUUID(),
  usage: {inputTokens: 0, outputTokens: 0},
  content,
});

describe('createPatkaPromptDirective', () => {
  it('tells the model to keep its answer short', () => {
    expect(
      new DefaultPatkaPromptFactory(
        new PatkaTools([]),
        '/home/user',
        createPatkaPromptDirective(),
      ).create([]),
    ).toContain('fewest words possible');
  });

  it('tells the model to answer directly when no tool is necessary', () => {
    expect(
      new DefaultPatkaPromptFactory(
        new PatkaTools([]),
        '/home/user',
        createPatkaPromptDirective(),
      ).create([]),
    ).toContain('If no tool is necessary, answer the user directly.');
  });

  it('tells the model the directory where Patka runs', () => {
    expect(
      new DefaultPatkaPromptFactory(
        new PatkaTools([]),
        '/home/user',
        createPatkaPromptDirective(),
      ).create([]),
    ).toContain('As an agent, your working directory is: /home/user');
  });

  it('asks for an answer when nothing has been said', () => {
    expect(
      new DefaultPatkaPromptFactory(new PatkaTools([]), '/home/user', createPatkaPromptDirective())
        .create([])
        .endsWith('\nAssistant:'),
    ).toBe(true);
  });

  it('labels who said what', () => {
    const patkaConversation = [said('hello'), answered('hi there')];

    expect(
      new DefaultPatkaPromptFactory(
        new PatkaTools([]),
        '/home/user',
        createPatkaPromptDirective(),
      ).create(patkaConversation),
    ).toContain(`User: hello
Assistant: hi there`);
  });

  it('labels what Patka said', () => {
    const patkaAgentUtterance: PatkaContextEntry = {
      type: 'PatkaAgentUtterance',
      timestamp: 0,
      performanceTimestamp: 0,
      root: none,
      parent: none,
      id: randomUUID(),
      content: 'Patka could not read your tool invocation',
    };

    expect(
      new DefaultPatkaPromptFactory(
        new PatkaTools([]),
        '/home/user',
        createPatkaPromptDirective(),
      ).create([patkaAgentUtterance]),
    ).toContain('Patka: Patka could not read your tool invocation');
  });

  it('leaves the last cue for the model to answer', () => {
    const patkaConversation = [said('hello')];

    expect(
      new DefaultPatkaPromptFactory(
        new PatkaTools([]),
        '/home/user',
        createPatkaPromptDirective(),
      ).create(patkaConversation),
    ).toContain(`User: hello

Assistant:`);
  });

  it('keeps the whole conversation, in order', () => {
    const patkaConversation = [
      said('my name is Zaphod'),
      answered('nice to meet you'),
      said('what is my name?'),
    ];

    expect(
      new DefaultPatkaPromptFactory(
        new PatkaTools([]),
        '/home/user',
        createPatkaPromptDirective(),
      ).create(patkaConversation),
    ).toContain(
      `User: my name is Zaphod
Assistant: nice to meet you
User: what is my name?`,
    );
  });

  it('says nothing about tools when it has none', () => {
    const prompt = new DefaultPatkaPromptFactory(
      new PatkaTools([]),
      '/home/user',
      createPatkaPromptDirective(),
    ).create([]);

    expect(prompt).not.toContain('You can use these tools');
  });

  it('presents every tool it was given', () => {
    const defaultPatkaPromptFactory = new DefaultPatkaPromptFactory(
      new PatkaTools([new ListFiles(), new ReadFile()]),
      '/home/user',
      createPatkaPromptDirective(),
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
      createPatkaPromptDirective(),
    );

    const prompt = defaultPatkaPromptFactory.create([]);

    expect(prompt).toContain('"required":["relativePath"]');
    expect(prompt).toContain('"type":"string"');
  });

  it('keeps the instruction before the tools, and the conversation after', () => {
    const defaultPatkaPromptFactory = new DefaultPatkaPromptFactory(
      new PatkaTools([new ListFiles()]),
      '/home/user',
      createPatkaPromptDirective(),
    );

    const prompt = defaultPatkaPromptFactory.create([]);

    expect(prompt.indexOf('fewest words possible')).toBeLessThan(prompt.indexOf('You can use'));
    expect(prompt.indexOf('You can use')).toBeLessThan(prompt.indexOf('Assistant:'));
  });

  it('tells the model how to ask for a tool', () => {
    const prompt = new DefaultPatkaPromptFactory(
      new PatkaTools([new ReadFile()]),
      '/home/user',
      createPatkaPromptDirective(),
    ).create([]);

    expect(prompt).toContain('single line');
    expect(prompt).toContain('$$$invoke(tool_name, {"key": "value"})');
    expect(prompt).toContain('$$$invoke(read_file, {"relativePath": "notes.txt"})');
  });

  it('tells the model never to guess a tool input', () => {
    const prompt = new DefaultPatkaPromptFactory(
      new PatkaTools([new ReadFile()]),
      '/home/user',
      createPatkaPromptDirective(),
    ).create([]);

    expect(prompt).toContain('Never invoke a tool as a guess.');
  });

  it('tells the model to ask a question when the request is not actionable', () => {
    const prompt = new DefaultPatkaPromptFactory(
      new PatkaTools([new ReadFile()]),
      '/home/user',
      createPatkaPromptDirective(),
    ).create([]);

    expect(prompt).toContain('ask the user a question instead');
  });

  it('gives the model the success and failure form of each tool output', () => {
    const prompt = new DefaultPatkaPromptFactory(
      new PatkaTools([new ReadFile()]),
      '/home/user',
      createPatkaPromptDirective(),
    ).create([]);

    expect(prompt).toContain('"type":{"const":"failure"}');
  });

  it('shows the success output a tool gave back', () => {
    const patkaToolResult: PatkaContextEntry = {
      type: 'PatkaToolOutput',
      timestamp: 0,
      performanceTimestamp: 0,
      root: some(randomUUID()),
      parent: none,
      id: randomUUID(),
      name: 'read_file',
      output: success(some('hello')),
    };

    const prompt = new DefaultPatkaPromptFactory(
      new PatkaTools([]),
      '/home/user',
      createPatkaPromptDirective(),
    ).create([patkaToolResult]);

    expect(prompt).toContain(
      'Tool output: {"type":"success","value":{"type":"some","value":"hello"}}',
    );
  });

  it('shows the failure output a tool gave back', () => {
    const patkaToolResult: PatkaContextEntry = {
      type: 'PatkaToolOutput',
      timestamp: 0,
      performanceTimestamp: 0,
      root: some(randomUUID()),
      parent: none,
      id: randomUUID(),
      name: 'read_file',
      output: failure(new Error('file not found')),
    };

    const prompt = new DefaultPatkaPromptFactory(
      new PatkaTools([]),
      '/home/user',
      createPatkaPromptDirective(),
    ).create([patkaToolResult]);

    expect(prompt).toContain('Tool output: {"type":"failure","error":"file not found"}');
  });
});
