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
  it('carries a manual for the model', () => {
    const tool = new ReadFile();

    expect(tool.manual.name).toBe('read_file');
    expect(tool.manual.summary).toContain('Reads');
    expect(tool.manual.usage).not.toBe('');
    expect(tool.manual.input.required).toEqual(['path']);
    expect(tool.manual.input.properties).toHaveProperty('path');
    expect(tool.manual.output.type).toBe('string');
  });

  it('emits what the file holds', async () => {
    const content = await withAFile('hello patka', () =>
      firstValueFrom(new ReadFile().invoke({path: 'note.txt'})),
    );

    expect(content).toBe('hello patka');
  });

  it('refuses an absolute path', async () => {
    await expect(
      firstValueFrom(new ReadFile().invoke({path: join(tmpdir(), 'note.txt')})),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('fails when the file does not exist', async () => {
    await expect(
      firstValueFrom(new ReadFile().invoke({path: 'patka-missing.txt'})),
    ).rejects.toThrow();
  });

  it('does not touch the disk until subscribed', () => {
    expect(() => new ReadFile().invoke({path: 'patka-missing.txt'})).not.toThrow();
  });
});
