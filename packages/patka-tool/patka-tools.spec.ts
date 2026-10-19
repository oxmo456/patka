import {firstValueFrom, of, throwError} from 'rxjs';
import {describe, expect, it, type Mock, vi} from 'vitest';
import type {JsonObject, JsonValue} from '../json/json.ts';
import {some} from '../option/option.ts';
import {success} from '../try/try.ts';
import type {PatkaTool} from './patka-tool.ts';
import {PatkaTools} from './patka-tools.ts';

type FakeTool = PatkaTool<JsonObject, JsonValue> & {invoke: Mock};

const aTool = (name: string, answer: string): FakeTool => ({
  name,
  llmManual: {
    name,
    input: {
      type: 'ObjectJsonSchemaLLMManual',
      title: name,
      description: '',
      properties: {},
    },
    output: {value: 'string', description: ''},
  },
  invoke: vi.fn(() => of(success(some(answer)))),
});

describe('PatkaTools', () => {
  it('lists no tool when it holds no tool', () => {
    expect(new PatkaTools([]).list()).toEqual([]);
  });

  it('lists every tool it holds', () => {
    const patkaTools = new PatkaTools([aTool('list_files', 'listed'), aTool('read_file', 'read')]);

    expect(patkaTools.list().map((patkaTool) => patkaTool.name)).toEqual([
      'list_files',
      'read_file',
    ]);
  });

  it('invokes the tool that carries that name', async () => {
    const listFiles = aTool('list_files', 'listed');
    const readFile = aTool('read_file', 'read');
    const patkaTools = new PatkaTools([listFiles, readFile]);

    const output = await firstValueFrom(patkaTools.invoke('read_file', {relativePath: 'note.txt'}));

    expect(output).toEqual(success(some('read')));
    expect(readFile.invoke).toHaveBeenCalledWith({relativePath: 'note.txt'});
    expect(listFiles.invoke).not.toHaveBeenCalled();
  });

  it('gives failure when no tool carries that name', async () => {
    const patkaTools = new PatkaTools([aTool('list_files', 'listed')]);

    const output = await firstValueFrom(patkaTools.invoke('write_file', {}));

    expect(output).toEqual({
      type: 'failure',
      error: new Error('patka has no tool named "write_file"'),
    });
  });

  it('gives failure with the error message when the tool fails', async () => {
    const readFile: FakeTool = {
      ...aTool('read_file', 'read'),
      invoke: vi.fn(() => throwError(() => new Error('file not found'))),
    };
    const patkaTools = new PatkaTools([readFile]);

    const output = await firstValueFrom(patkaTools.invoke('read_file', {relativePath: 'note.txt'}));

    expect(output).toEqual({type: 'failure', error: new Error('file not found')});
  });

  it('does not invoke anything until subscribed', () => {
    const listFiles = aTool('list_files', 'listed');
    const patkaTools = new PatkaTools([listFiles]);

    patkaTools.invoke('list_files', {});

    expect(listFiles.invoke).not.toHaveBeenCalled();
  });
});
