import {execFileSync} from 'node:child_process';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {GitStatus} from './git-status.ts';

describe('GitStatus', () => {
  it('carries a manual for the LLM', () => {
    expect(new GitStatus(tmpdir()).name).toBe('git_status');
  });

  it('emits what git status prints in a repository', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-git-'));
    execFileSync('git', ['init', '--quiet'], {cwd: path});

    const output = await firstValueFrom(new GitStatus(path).invoke());

    expect(output).toContain('No commits yet');
  });

  it('fails outside of a git repository', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-git-'));

    await expect(firstValueFrom(new GitStatus(path).invoke())).rejects.toThrow();
  });

  it('does not run git until subscribed', () => {
    expect(() => new GitStatus(tmpdir()).invoke()).not.toThrow();
  });
});
