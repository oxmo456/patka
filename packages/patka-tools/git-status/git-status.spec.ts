import {execFileSync} from 'node:child_process';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {defaultPatkaDictionary, PatkaText} from '../../patka-text/patka-text.ts';
import {GitStatus} from './git-status.ts';

describe('GitStatus', () => {
  it('carries a manual for the LLM', () => {
    expect(new GitStatus(tmpdir(), new PatkaText(defaultPatkaDictionary)).name).toBe('git_status');
  });

  it('emits what git status prints in a repository', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-git-'));
    execFileSync('git', ['init', '--quiet'], {cwd: path});

    const output = await firstValueFrom(
      new GitStatus(path, new PatkaText(defaultPatkaDictionary)).invoke(),
    );

    expect(output).toContain('No commits yet');
  });

  it('fails outside of a git repository', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-git-'));

    await expect(
      firstValueFrom(new GitStatus(path, new PatkaText(defaultPatkaDictionary)).invoke()),
    ).rejects.toThrow();
  });

  it('does not run git until subscribed', () => {
    expect(() =>
      new GitStatus(tmpdir(), new PatkaText(defaultPatkaDictionary)).invoke(),
    ).not.toThrow();
  });
});
