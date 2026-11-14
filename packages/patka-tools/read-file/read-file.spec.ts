import {memfs} from 'memfs';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import type {FileSystem} from '../../file-system/file-system.ts';
import defaultPatkaDictionary from '../../patka-text/default.json' with {type: 'json'};
import {PatkaText} from '../../patka-text/patka-text.ts';
import {ReadFile} from './read-file.ts';

describe('ReadFile', () => {
  it('carries a manual for the LLM', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;
    const readFile = new ReadFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem);

    expect(readFile.name).toBe('read_file');
  });

  it('emits what the file holds', async () => {
    const fileSystem = memfs({'/work/note.txt': 'hello patka'}).fs as unknown as FileSystem;

    const content = await firstValueFrom(
      new ReadFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
        relativePath: 'note.txt',
      }),
    );

    expect(content).toEqual('hello patka');
  });

  it('refuses an absolute path', async () => {
    const fileSystem = memfs({'/work/note.txt': 'hello patka'}).fs as unknown as FileSystem;

    await expect(
      firstValueFrom(
        new ReadFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
          relativePath: '/work/note.txt',
        }),
      ),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('fails when the file does not exist', async () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    await expect(
      firstValueFrom(
        new ReadFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
          relativePath: 'patka-missing.txt',
        }),
      ),
    ).rejects.toThrow();
  });

  it('does not touch the disk until subscribed', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    expect(() =>
      new ReadFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
        relativePath: 'patka-missing.txt',
      }),
    ).not.toThrow();
  });
});
