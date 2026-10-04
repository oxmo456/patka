import {mkdir, mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {some} from '../option.ts';
import {ListFiles} from './list-files.ts';

const inADirectory = async <T>(run: () => Promise<T>): Promise<T> => {
  const path = await mkdtemp(join(tmpdir(), 'patka-list-'));
  await writeFile(join(path, 'second.ts'), '');
  await writeFile(join(path, 'first.ts'), '');
  await mkdir(join(path, 'nested'));
  const before = process.cwd();
  process.chdir(path);

  try {
    return await run();
  } finally {
    process.chdir(before);
  }
};

describe('ListFiles', () => {
  it('carries a manual for the model', () => {
    const listFiles = new ListFiles();

    expect(listFiles.manual.name).toBe('list_files');
    expect(listFiles.manual.summary).toContain('Lists the files');
    expect(listFiles.manual.usage).not.toBe('');
    expect(listFiles.manual.input.required).toEqual(['relativePath']);
    expect(listFiles.manual.input.properties).toHaveProperty('relativePath');
    expect(listFiles.manual.output.type).toBe('array');
    expect(listFiles.manual.output.items).toEqual({type: 'string'});
  });

  it('lists what the directory holds, in order', async () => {
    const listing = await inADirectory(() =>
      firstValueFrom(new ListFiles().invoke({relativePath: '.'})),
    );

    expect(listing).toEqual(some(['first.ts', 'nested/', 'second.ts']));
  });

  it('refuses an absolute path', async () => {
    await expect(firstValueFrom(new ListFiles().invoke({relativePath: tmpdir()}))).rejects.toThrow(
      'only accepts a relative path',
    );
  });

  it('fails when the directory does not exist', async () => {
    await expect(
      firstValueFrom(new ListFiles().invoke({relativePath: 'patka-does-not-exist'})),
    ).rejects.toThrow();
  });

  it('does not touch the disk until subscribed', () => {
    expect(() => new ListFiles().invoke({relativePath: 'patka-does-not-exist'})).not.toThrow();
  });
});
