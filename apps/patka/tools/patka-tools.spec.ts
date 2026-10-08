import {firstValueFrom, of, throwError} from 'rxjs';
import {describe, expect, it, type Mock, vi} from 'vitest';
import type {JsonObject, JsonValue} from '../json.ts';
import {some} from '../option.ts';
import {success} from '../try.ts';
import {ListFiles} from './list-files/list-files.ts';
import type {PatkaTool} from './patka-tool.ts';
import {PatkaTools} from './patka-tools.ts';
import {ReadFile} from './read-file/read-file.ts';

type FakeTool = PatkaTool<JsonObject, JsonValue> & {invoke: Mock};

const aTool = (name: string, answer: string): FakeTool => ({
  manual: {
    name,
    summary: `summary of ${name}`,
    usage: `usage of ${name}`,
    input: {type: 'object' as const, properties: {}, required: []},
    output: {type: 'string' as const},
  },
  invoke: vi.fn(() => of(success(some(answer)))),
});

describe('PatkaTools', () => {
  it('has no manual when it holds no tool', () => {
    expect(new PatkaTools([]).manuals()).toEqual([]);
  });

  it('lists the manual of every tool it holds', () => {
    const patkaTools = new PatkaTools([new ListFiles(), new ReadFile()]);

    expect(patkaTools.manuals().map((manual) => manual.name)).toEqual(['list_files', 'read_file']);
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
