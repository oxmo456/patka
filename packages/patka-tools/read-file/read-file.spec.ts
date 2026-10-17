import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {some} from '../../option/option.ts';
import {success} from '../../try/try.ts';
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

    expect(readFile.llmManual.name).toBe('read_file');
    expect(readFile.llmManual.usage).not.toBe('');
    expect(readFile.llmManual.input.required).toEqual(['relativePath']);
    expect(readFile.llmManual.input.properties).toHaveProperty('relativePath');
    expect(readFile.llmManual.output.oneOf).toHaveLength(2);
  });

  it('emits what the file holds', async () => {
    const content = await withAFile('hello patka', () =>
      firstValueFrom(new ReadFile().invoke({relativePath: 'note.txt'})),
    );

    expect(content).toEqual(success(some('hello patka')));
  });

  it('refuses an absolute path', async () => {
    expect(
      await firstValueFrom(new ReadFile().invoke({relativePath: join(tmpdir(), 'note.txt')})),
    ).toMatchObject({
      type: 'failure',
      error: {message: expect.stringContaining('only accepts a relative path')},
    });
  });

  it('fails when the file does not exist', async () => {
    expect(
      await firstValueFrom(new ReadFile().invoke({relativePath: 'patka-missing.txt'})),
    ).toMatchObject({type: 'failure'});
  });

  it('does not touch the disk until subscribed', () => {
    expect(() => new ReadFile().invoke({relativePath: 'patka-missing.txt'})).not.toThrow();
  });
});
