import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {ReadFile} from './read-file.ts';

describe('ReadFile', () => {
  it('carries a manual for the LLM', () => {
    const readFile = new ReadFile(tmpdir());

    expect(readFile.name).toBe('read_file');
  });

  it('emits what the file holds', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-read-'));
    await writeFile(join(path, 'note.txt'), 'hello patka');

    const content = await firstValueFrom(new ReadFile(path).invoke({relativePath: 'note.txt'}));

    expect(content).toEqual('hello patka');
  });

  it('refuses an absolute path', async () => {
    await expect(
      firstValueFrom(new ReadFile(tmpdir()).invoke({relativePath: join(tmpdir(), 'note.txt')})),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('fails when the file does not exist', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-read-'));

    await expect(
      firstValueFrom(new ReadFile(path).invoke({relativePath: 'patka-missing.txt'})),
    ).rejects.toThrow();
  });

  it('does not touch the disk until subscribed', () => {
    expect(() => new ReadFile(tmpdir()).invoke({relativePath: 'patka-missing.txt'})).not.toThrow();
  });
});
