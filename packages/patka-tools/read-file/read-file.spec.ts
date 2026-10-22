import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {defaultPatkaDictionary, PatkaText} from '../../patka-text/patka-text.ts';
import {ReadFile} from './read-file.ts';

describe('ReadFile', () => {
  it('carries a manual for the LLM', () => {
    const readFile = new ReadFile(tmpdir(), new PatkaText(defaultPatkaDictionary));

    expect(readFile.name).toBe('read_file');
  });

  it('emits what the file holds', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-read-'));
    await writeFile(join(path, 'note.txt'), 'hello patka');

    const content = await firstValueFrom(
      new ReadFile(path, new PatkaText(defaultPatkaDictionary)).invoke({relativePath: 'note.txt'}),
    );

    expect(content).toEqual('hello patka');
  });

  it('refuses an absolute path', async () => {
    await expect(
      firstValueFrom(
        new ReadFile(tmpdir(), new PatkaText(defaultPatkaDictionary)).invoke({
          relativePath: join(tmpdir(), 'note.txt'),
        }),
      ),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('fails when the file does not exist', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-read-'));

    await expect(
      firstValueFrom(
        new ReadFile(path, new PatkaText(defaultPatkaDictionary)).invoke({
          relativePath: 'patka-missing.txt',
        }),
      ),
    ).rejects.toThrow();
  });

  it('does not touch the disk until subscribed', () => {
    expect(() =>
      new ReadFile(tmpdir(), new PatkaText(defaultPatkaDictionary)).invoke({
        relativePath: 'patka-missing.txt',
      }),
    ).not.toThrow();
  });
});
