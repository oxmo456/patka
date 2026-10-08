import {existsSync} from 'node:fs';
import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {cd} from 'zx';
import {ApplyPatch} from './apply-patch.ts';

describe('ApplyPatch', () => {
  it('carries a manual for the model', () => {
    expect(new ApplyPatch().manual.name).toBe('apply_patch');
  });

  it('changes a file', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-patch-'));
    await writeFile(join(path, 'note.txt'), 'hello\n');
    const patch = [
      '--- a/note.txt',
      '+++ b/note.txt',
      '@@ -1 +1 @@',
      '-hello',
      '+hello patka',
      '',
    ].join('\n');
    const before = process.cwd();
    cd(path);

    try {
      await firstValueFrom(new ApplyPatch().invoke({patch}));
    } finally {
      cd(before);
    }

    expect(await readFile(join(path, 'note.txt'), 'utf8')).toBe('hello patka\n');
  });

  it('emits a line for each file it applied', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-patch-'));
    await writeFile(join(path, 'note.txt'), 'hello\n');
    const patch = [
      '--- a/note.txt',
      '+++ b/note.txt',
      '@@ -1 +1 @@',
      '-hello',
      '+hello patka',
      '',
    ].join('\n');
    const before = process.cwd();
    cd(path);

    try {
      const output = await firstValueFrom(new ApplyPatch().invoke({patch}));

      expect(output).toEqual({
        type: 'success',
        value: {type: 'some', value: expect.stringContaining('Applied patch note.txt cleanly.')},
      });
    } finally {
      cd(before);
    }
  });

  it('emits the warnings git prints on stderr', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-patch-'));
    await writeFile(join(path, 'note.txt'), 'hello\n');
    const patch = [
      '--- a/note.txt',
      '+++ b/note.txt',
      '@@ -1 +1 @@',
      '-hello',
      '+hello patka   ',
      '',
    ].join('\n');
    const before = process.cwd();
    cd(path);

    try {
      const output = await firstValueFrom(new ApplyPatch().invoke({patch}));

      expect(output).toEqual({
        type: 'success',
        value: {
          type: 'some',
          value: expect.stringContaining('warning: 1 line adds whitespace errors.'),
        },
      });
    } finally {
      cd(before);
    }
  });

  it('creates a file', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-patch-'));
    const patch = ['--- /dev/null', '+++ b/note.txt', '@@ -0,0 +1 @@', '+hello patka', ''].join(
      '\n',
    );
    const before = process.cwd();
    cd(path);

    try {
      await firstValueFrom(new ApplyPatch().invoke({patch}));
    } finally {
      cd(before);
    }

    expect(await readFile(join(path, 'note.txt'), 'utf8')).toBe('hello patka\n');
  });

  it('deletes a file', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-patch-'));
    await writeFile(join(path, 'note.txt'), 'hello\n');
    const patch = ['--- a/note.txt', '+++ /dev/null', '@@ -1 +0,0 @@', '-hello', ''].join('\n');
    const before = process.cwd();
    cd(path);

    try {
      await firstValueFrom(new ApplyPatch().invoke({patch}));
    } finally {
      cd(before);
    }

    expect(existsSync(join(path, 'note.txt'))).toBe(false);
  });

  it('accepts a hunk header with wrong line counts', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-patch-'));
    await writeFile(join(path, 'note.txt'), 'hello\n');
    const patch = [
      '--- a/note.txt',
      '+++ b/note.txt',
      '@@ -1,7 +1,9 @@',
      '-hello',
      '+hello patka',
      '',
    ].join('\n');
    const before = process.cwd();
    cd(path);

    try {
      await firstValueFrom(new ApplyPatch().invoke({patch}));
    } finally {
      cd(before);
    }

    expect(await readFile(join(path, 'note.txt'), 'utf8')).toBe('hello patka\n');
  });

  it('gives failure with the error from git when the patch does not match the file', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-patch-'));
    await writeFile(join(path, 'note.txt'), 'hello\n');
    const patch = [
      '--- a/note.txt',
      '+++ b/note.txt',
      '@@ -1 +1 @@',
      '-goodbye',
      '+hello patka',
      '',
    ].join('\n');
    const before = process.cwd();
    cd(path);

    try {
      const output = await firstValueFrom(new ApplyPatch().invoke({patch}));

      expect(output).toEqual({
        type: 'failure',
        error: expect.objectContaining({
          message: expect.stringContaining('error: patch failed: note.txt:1'),
        }),
      });
    } finally {
      cd(before);
    }
  });

  it('does not touch the disk until subscribed', () => {
    expect(() => new ApplyPatch().invoke({patch: 'not a patch'})).not.toThrow();
  });
});
