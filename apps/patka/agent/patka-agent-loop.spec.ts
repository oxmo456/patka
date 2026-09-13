import {randomUUID} from 'node:crypto';
import {type Observable, of} from 'rxjs';
import {describe, expect, it, vi} from 'vitest';
import type {PatkaMessage} from '../inference/patka-message.ts';
import {PatkaLogger} from '../patka-logger.ts';
import type {PatkaTool} from '../tools/patka-tool.ts';
import {PatkaTools} from '../tools/patka-tools.ts';
import {PatkaAgentLoop} from './patka-agent-loop.ts';

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

describe('PatkaAgentLoop', () => {
  it('gives back the answer when the model asks for no tool', () => {
    const patkaAgentLoop = new PatkaAgentLoop(
      'patka',
      {generate: () => of({message: 'Paris', id: randomUUID()})},
      new PatkaTools([]),
      new PatkaLogger(),
    );
    const received: Array<string> = [];

    patkaAgentLoop
      .handle('User: capital of France?')
      .subscribe((content) => received.push(content));

    expect(received).toEqual(['Paris']);
  });

  it('says which tool it runs before the answer arrives', () => {
    const replies = ['$$$invoke(read_file, {"path": "note.txt"})', 'the note says hello'];
    const patkaAgentLoop = new PatkaAgentLoop(
      'patka',
      {generate: () => of({message: replies.shift() ?? '', id: randomUUID()})},
      new PatkaTools([aTool('read_file', 'hello')]),
      new PatkaLogger(),
    );
    const received: Array<string> = [];

    patkaAgentLoop.handle('User: read note.txt').subscribe((content) => received.push(content));

    expect(received[0]).toContain('using read_file');
  });

  it('feeds the tool output back and answers from it', () => {
    const replies = ['$$$invoke(read_file, {"path": "note.txt"})', 'the note says hello'];
    const patkaAgentLoop = new PatkaAgentLoop(
      'patka',
      {generate: () => of({message: replies.shift() ?? '', id: randomUUID()})},
      new PatkaTools([aTool('read_file', 'hello')]),
      new PatkaLogger(),
    );
    const received: Array<string> = [];

    patkaAgentLoop.handle('User: read note.txt').subscribe((content) => received.push(content));

    expect(received.at(-1)).toBe('the note says hello');
  });

  it('runs a second tool when the model asks again', () => {
    const replies = [
      '$$$invoke(list_files, {"path": "."})',
      '$$$invoke(read_file, {"path": "note.txt"})',
      'the note says hello',
    ];
    const patkaAgentLoop = new PatkaAgentLoop(
      'patka',
      {generate: () => of({message: replies.shift() ?? '', id: randomUUID()})},
      new PatkaTools([aTool('list_files', 'note.txt'), aTool('read_file', 'hello')]),
      new PatkaLogger(),
    );
    const received: Array<string> = [];

    patkaAgentLoop.handle('User: read the note').subscribe((content) => received.push(content));

    expect(received.at(-1)).toBe('the note says hello');
  });

  it('carries every tool output into the next prompt', () => {
    const replies = [
      '$$$invoke(list_files, {"path": "."})',
      '$$$invoke(read_file, {"path": "note.txt"})',
      'the note says hello',
    ];
    const prompts: Array<string> = [];
    const generate = vi.fn((patkaMessage: PatkaMessage) => {
      prompts.push(patkaMessage.message);

      return of({message: replies.shift() ?? '', id: randomUUID()});
    });
    const patkaAgentLoop = new PatkaAgentLoop(
      'patka',
      {generate},
      new PatkaTools([aTool('list_files', 'note.txt'), aTool('read_file', 'hello')]),
      new PatkaLogger(),
    );

    patkaAgentLoop.handle('User: read the note').subscribe();

    expect(prompts[2]).toContain('Tool output: "hello"');
  });

  it('stops asking the engine after five rounds', () => {
    const generate = vi.fn(() =>
      of({message: '$$$invoke(read_file, {"path": "note.txt"})', id: randomUUID()}),
    );
    const patkaAgentLoop = new PatkaAgentLoop(
      'patka',
      {generate},
      new PatkaTools([aTool('read_file', 'hello')]),
      new PatkaLogger(),
    );

    patkaAgentLoop.handle('User: read the note').subscribe();

    expect(generate).toHaveBeenCalledTimes(5);
  });

  it('gives back the reply as it is when the input is not valid json', () => {
    const patkaAgentLoop = new PatkaAgentLoop(
      'patka',
      {generate: () => of({message: '$$$invoke(read_file, {not json})', id: randomUUID()})},
      new PatkaTools([aTool('read_file', 'hello')]),
      new PatkaLogger(),
    );
    const received: Array<string> = [];

    patkaAgentLoop.handle('User: read the note').subscribe((content) => received.push(content));

    expect(received).toEqual(['$$$invoke(read_file, {not json})']);
  });
});
