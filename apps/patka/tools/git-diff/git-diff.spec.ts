import {execFileSync} from 'node:child_process';
import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {cd} from 'zx';
import {GitDiff} from './git-diff.ts';

describe('GitDiff', () => {
  it('carries a manual for the model', () => {
    expect(new GitDiff().manual.name).toBe('git_diff');
  });

  it('emits the change made to a committed file', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-git-'));
    execFileSync('git', ['init', '--quiet'], {cwd: path});
    await writeFile(join(path, 'note.txt'), 'hello\n');
    execFileSync('git', ['add', 'note.txt'], {cwd: path});
    execFileSync(
      'git',
      ['-c', 'user.name=patka', '-c', 'user.email=patka@test', 'commit', '--quiet', '-m', 'init'],
      {cwd: path},
    );
    await writeFile(join(path, 'note.txt'), 'hello patka\n');
    const before = process.cwd();
    cd(path);

    try {
      const output = await firstValueFrom(new GitDiff().invoke({relativePath: 'note.txt'}));

      expect(output).toEqual({
        type: 'success',
        value: {type: 'some', value: expect.stringContaining('+hello patka')},
      });
    } finally {
      cd(before);
    }
  });

  it('emits nothing for a file with no change', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-git-'));
    execFileSync('git', ['init', '--quiet'], {cwd: path});
    await writeFile(join(path, 'note.txt'), 'hello\n');
    execFileSync('git', ['add', 'note.txt'], {cwd: path});
    execFileSync(
      'git',
      ['-c', 'user.name=patka', '-c', 'user.email=patka@test', 'commit', '--quiet', '-m', 'init'],
      {cwd: path},
    );
    const before = process.cwd();
    cd(path);

    try {
      const output = await firstValueFrom(new GitDiff().invoke({relativePath: 'note.txt'}));

      expect(output).toEqual({type: 'success', value: {type: 'some', value: ''}});
    } finally {
      cd(before);
    }
  });

  it('refuses an absolute path', async () => {
    expect(
      await firstValueFrom(new GitDiff().invoke({relativePath: join(tmpdir(), 'note.txt')})),
    ).toMatchObject({
      type: 'failure',
      error: {message: expect.stringContaining('only accepts a relative path')},
    });
  });

  it('does not run git until subscribed', () => {
    expect(() => new GitDiff().invoke({relativePath: 'note.txt'})).not.toThrow();
  });
});
