import {mkdtemp, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {WriteFile} from './write-file.ts';

describe('WriteFile', () => {
  it('carries a manual for the LLM', () => {
    const writeFile = new WriteFile(tmpdir());

    expect(writeFile.name).toBe('write_file');
  });

  it('writes the content to the file', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-write-'));

    await firstValueFrom(
      new WriteFile(path).invoke({relativePath: 'note.txt', content: 'hello patka'}),
    );

    expect(await readFile(join(path, 'note.txt'), 'utf8')).toBe('hello patka');
  });

  it('emits the path it wrote', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-write-'));

    const output = await firstValueFrom(
      new WriteFile(path).invoke({relativePath: 'note.txt', content: 'hello patka'}),
    );

    expect(output).toEqual('note.txt');
  });

  it('refuses an absolute path', async () => {
    await expect(
      firstValueFrom(
        new WriteFile(tmpdir()).invoke({relativePath: join(tmpdir(), 'note.txt'), content: ''}),
      ),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('creates the directories that do not exist', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-write-'));

    await firstValueFrom(
      new WriteFile(path).invoke({relativePath: 'missing/note.txt', content: 'hello patka'}),
    );

    expect(await readFile(join(path, 'missing/note.txt'), 'utf8')).toBe('hello patka');
  });

  it('does not touch the disk until subscribed', () => {
    expect(() =>
      new WriteFile(tmpdir()).invoke({relativePath: 'note.txt', content: ''}),
    ).not.toThrow();
  });
});
