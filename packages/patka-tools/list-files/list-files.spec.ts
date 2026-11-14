import {memfs} from 'memfs';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import type {FileSystem} from '../../file-system/file-system.ts';
import defaultPatkaDictionary from '../../patka-text/default.json' with {type: 'json'};
import {PatkaText} from '../../patka-text/patka-text.ts';
import {ListFiles} from './list-files.ts';

describe('ListFiles', () => {
  it('carries a manual for the LLM', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;
    const listFiles = new ListFiles('/work', new PatkaText(defaultPatkaDictionary), fileSystem);

    expect(listFiles.name).toBe('list_files');
  });

  it('lists what the directory holds, in order', async () => {
    const fileSystem = memfs({
      '/work/second.ts': '',
      '/work/first.ts': '',
      '/work/nested': null,
    }).fs as unknown as FileSystem;

    const listing = await firstValueFrom(
      new ListFiles('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
        relativePath: '.',
      }),
    );

    expect(listing).toEqual(['first.ts', 'nested/', 'second.ts']);
  });

  it('refuses an absolute path', async () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    await expect(
      firstValueFrom(
        new ListFiles('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
          relativePath: '/work',
        }),
      ),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('fails when the directory does not exist', async () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    await expect(
      firstValueFrom(
        new ListFiles('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
          relativePath: 'patka-does-not-exist',
        }),
      ),
    ).rejects.toThrow();
  });

  it('does not touch the disk until subscribed', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    expect(() =>
      new ListFiles('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
        relativePath: 'patka-does-not-exist',
      }),
    ).not.toThrow();
  });
});
