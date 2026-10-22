import {mkdir, mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {defaultPatkaDictionary, PatkaText} from '../../patka-text/patka-text.ts';
import {ListFiles} from './list-files.ts';

describe('ListFiles', () => {
  it('carries a manual for the LLM', () => {
    const listFiles = new ListFiles(tmpdir(), new PatkaText(defaultPatkaDictionary));

    expect(listFiles.name).toBe('list_files');
  });

  it('lists what the directory holds, in order', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-list-'));
    await writeFile(join(path, 'second.ts'), '');
    await writeFile(join(path, 'first.ts'), '');
    await mkdir(join(path, 'nested'));

    const listing = await firstValueFrom(
      new ListFiles(path, new PatkaText(defaultPatkaDictionary)).invoke({relativePath: '.'}),
    );

    expect(listing).toEqual(['first.ts', 'nested/', 'second.ts']);
  });

  it('refuses an absolute path', async () => {
    await expect(
      firstValueFrom(
        new ListFiles(tmpdir(), new PatkaText(defaultPatkaDictionary)).invoke({
          relativePath: tmpdir(),
        }),
      ),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('fails when the directory does not exist', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-list-'));

    await expect(
      firstValueFrom(
        new ListFiles(path, new PatkaText(defaultPatkaDictionary)).invoke({
          relativePath: 'patka-does-not-exist',
        }),
      ),
    ).rejects.toThrow();
  });

  it('does not touch the disk until subscribed', () => {
    expect(() =>
      new ListFiles(tmpdir(), new PatkaText(defaultPatkaDictionary)).invoke({
        relativePath: 'patka-does-not-exist',
      }),
    ).not.toThrow();
  });
});
