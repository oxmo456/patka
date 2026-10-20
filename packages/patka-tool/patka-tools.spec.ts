import {firstValueFrom, of} from 'rxjs';
import {describe, expect, it, type Mock, vi} from 'vitest';
import type {JsonObject, JsonValue} from '../json/json.ts';
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
  invoke: vi.fn(() => of(answer)),
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

  it('emits the output of the tool that carries that name', async () => {
    const patkaTools = new PatkaTools([aTool('list_files', 'listed'), aTool('read_file', 'read')]);

    const output = await firstValueFrom(patkaTools.invoke('read_file', {relativePath: 'note.txt'}));

    expect(output).toBe('read');
  });

  it('gives the input to the tool that carries that name', async () => {
    const readFile = aTool('read_file', 'read');
    const patkaTools = new PatkaTools([aTool('list_files', 'listed'), readFile]);

    await firstValueFrom(patkaTools.invoke('read_file', {relativePath: 'note.txt'}));

    expect(readFile.invoke).toHaveBeenCalledWith({relativePath: 'note.txt'});
  });

  it('does not invoke the tools that carry another name', async () => {
    const listFiles = aTool('list_files', 'listed');
    const patkaTools = new PatkaTools([listFiles, aTool('read_file', 'read')]);

    await firstValueFrom(patkaTools.invoke('read_file', {relativePath: 'note.txt'}));

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
