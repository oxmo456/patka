import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {ReadFile} from './read-file.ts';

const withAFile = async <T>(content: string, run: () => Promise<T>): Promise<T> => {
  const path = await mkdtemp(join(tmpdir(), 'patka-read-'));
  await writeFile(join(path, 'note.txt'), content);
  const before = process.cwd();
  process.chdir(path);

  try {
    return await run();
  } finally {
    process.chdir(before);
  }
};

describe('ReadFile', () => {
  it('carries a manual for the LLM', () => {
    const readFile = new ReadFile();

    expect(readFile.name).toBe('read_file');
  });

  it('emits what the file holds', async () => {
    const content = await withAFile('hello patka', () =>
      firstValueFrom(new ReadFile().invoke({relativePath: 'note.txt'})),
    );

    expect(content).toEqual('hello patka');
  });

  it('refuses an absolute path', async () => {
    await expect(
      firstValueFrom(new ReadFile().invoke({relativePath: join(tmpdir(), 'note.txt')})),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('fails when the file does not exist', async () => {
    await expect(
      firstValueFrom(new ReadFile().invoke({relativePath: 'patka-missing.txt'})),
    ).rejects.toThrow();
  });

  it('does not touch the disk until subscribed', () => {
    expect(() => new ReadFile().invoke({relativePath: 'patka-missing.txt'})).not.toThrow();
  });
});
