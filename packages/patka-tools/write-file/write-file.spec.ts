import {memfs} from 'memfs';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import type {FileSystem} from '../../file-system/file-system.ts';
import defaultPatkaDictionary from '../../patka-text/default.json' with {type: 'json'};
import {PatkaText} from '../../patka-text/patka-text.ts';
import {WriteFile} from './write-file.ts';

describe('WriteFile', () => {
  it('carries a manual for the LLM', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;
    const writeFile = new WriteFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem);

    expect(writeFile.name).toBe('write_file');
  });

  it('writes the content to the file', async () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    await firstValueFrom(
      new WriteFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
        relativePath: 'note.txt',
        content: 'hello patka',
      }),
    );

    expect(await fileSystem.promises.readFile('/work/note.txt', 'utf8')).toBe('hello patka');
  });

  it('emits the path it wrote', async () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    const output = await firstValueFrom(
      new WriteFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
        relativePath: 'note.txt',
        content: 'hello patka',
      }),
    );

    expect(output).toEqual('note.txt');
  });

  it('refuses an absolute path', async () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    await expect(
      firstValueFrom(
        new WriteFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
          relativePath: '/work/note.txt',
          content: '',
        }),
      ),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('creates the directories that do not exist', async () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    await firstValueFrom(
      new WriteFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
        relativePath: 'missing/note.txt',
        content: 'hello patka',
      }),
    );

    expect(await fileSystem.promises.readFile('/work/missing/note.txt', 'utf8')).toBe(
      'hello patka',
    );
  });

  it('does not touch the disk until subscribed', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    expect(() =>
      new WriteFile('/work', new PatkaText(defaultPatkaDictionary), fileSystem).invoke({
        relativePath: 'note.txt',
        content: '',
      }),
    ).not.toThrow();
  });
});
