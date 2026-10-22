import {execFileSync} from 'node:child_process';
import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {defaultPatkaDictionary, PatkaText} from '../../patka-text/patka-text.ts';
import {GitDiff} from './git-diff.ts';

describe('GitDiff', () => {
  it('carries a manual for the LLM', () => {
    expect(new GitDiff(tmpdir(), new PatkaText(defaultPatkaDictionary)).name).toBe('git_diff');
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

    const output = await firstValueFrom(
      new GitDiff(path, new PatkaText(defaultPatkaDictionary)).invoke({relativePath: 'note.txt'}),
    );

    expect(output).toContain('+hello patka');
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

    const output = await firstValueFrom(
      new GitDiff(path, new PatkaText(defaultPatkaDictionary)).invoke({relativePath: 'note.txt'}),
    );

    expect(output).toBe('');
  });

  it('refuses an absolute path', async () => {
    await expect(
      firstValueFrom(
        new GitDiff(tmpdir(), new PatkaText(defaultPatkaDictionary)).invoke({
          relativePath: join(tmpdir(), 'note.txt'),
        }),
      ),
    ).rejects.toThrow('only accepts a relative path');
  });

  it('does not run git until subscribed', () => {
    expect(() =>
      new GitDiff(tmpdir(), new PatkaText(defaultPatkaDictionary)).invoke({
        relativePath: 'note.txt',
      }),
    ).not.toThrow();
  });
});
