import {mkdtemp, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {some} from '../option.ts';
import {WriteFile} from './write-file.ts';

const inADirectory = async <T>(run: () => Promise<T>): Promise<T> => {
  const path = await mkdtemp(join(tmpdir(), 'patka-write-'));
  const before = process.cwd();
  process.chdir(path);

  try {
    return await run();
  } finally {
    process.chdir(before);
  }
};

describe('WriteFile', () => {
  it('carries a manual for the model', () => {
    const writeFile = new WriteFile();

    expect(writeFile.manual.name).toBe('write_file');
    expect(writeFile.manual.summary).toContain('Writes');
    expect(writeFile.manual.usage).not.toBe('');
    expect(writeFile.manual.input.required).toEqual(['relativePath', 'content']);
    expect(writeFile.manual.input.properties).toHaveProperty('relativePath');
    expect(writeFile.manual.input.properties).toHaveProperty('content');
    expect(writeFile.manual.output.type).toBe('string');
  });

  it('writes the content to the file', async () => {
    const content = await inADirectory(async () => {
      await firstValueFrom(
        new WriteFile().invoke({relativePath: 'note.txt', content: 'hello patka'}),
      );

      return readFile('note.txt', 'utf8');
    });

    expect(content).toBe('hello patka');
  });

  it('emits the path it wrote', async () => {
    const output = await inADirectory(() =>
      firstValueFrom(new WriteFile().invoke({relativePath: 'note.txt', content: 'hello patka'})),
    );

    expect(output).toEqual(some('note.txt'));
  });

  it('refuses an absolute path', async () => {
    await expect(
      firstValueFrom(
        new WriteFile().invoke({relativePath: join(tmpdir(), 'note.txt'), content: ''}),
      ),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('fails when the directory does not exist', async () => {
    await expect(
      inADirectory(() =>
        firstValueFrom(new WriteFile().invoke({relativePath: 'missing/note.txt', content: ''})),
      ),
    ).rejects.toThrow();
  });

  it('does not touch the disk until subscribed', () => {
    expect(() => new WriteFile().invoke({relativePath: 'note.txt', content: ''})).not.toThrow();
  });
});
