import {firstValueFrom, of} from 'rxjs';
import {describe, expect, it, type Mock, vi} from 'vitest';
import type {JsonObject, JsonValue} from '../json.ts';
import {ListFiles} from './list-files.ts';
import type {PatkaTool} from './patka-tool.ts';
import {PatkaTools} from './patka-tools.ts';
import {ReadFile} from './read-file.ts';

type FakeTool = PatkaTool<JsonObject, JsonValue> & {invoke: Mock};

const aTool = (name: string, answer: string): FakeTool => ({
  manual: {
    name,
    summary: `summary of ${name}`,
    usage: `usage of ${name}`,
    input: {type: 'object' as const, properties: {}, required: []},
    output: {type: 'string' as const},
  },
  invoke: vi.fn(() => of(answer)),
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

    const output = await firstValueFrom(patkaTools.invoke('read_file', {path: 'note.txt'}));

    expect(output).toBe('read');
    expect(readFile.invoke).toHaveBeenCalledWith({path: 'note.txt'});
    expect(listFiles.invoke).not.toHaveBeenCalled();
  });

  it('fails when no tool carries that name', async () => {
    const patkaTools = new PatkaTools([aTool('list_files', 'listed')]);

    await expect(firstValueFrom(patkaTools.invoke('write_file', {}))).rejects.toThrow(
      'patka has no tool named "write_file"',
    );
  });

  it('does not invoke anything until subscribed', () => {
    const listFiles = aTool('list_files', 'listed');
    const patkaTools = new PatkaTools([listFiles]);

    patkaTools.invoke('list_files', {});

    expect(listFiles.invoke).not.toHaveBeenCalled();
  });
});
