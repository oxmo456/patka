import {execFileSync} from 'node:child_process';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {firstValueFrom} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {cd} from 'zx';
import {GitStatus} from './git-status.ts';

describe('GitStatus', () => {
  it('carries a manual for the model', () => {
    expect(new GitStatus().manual.name).toBe('git_status');
  });

  it('emits what git status prints in a repository', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-git-'));
    execFileSync('git', ['init', '--quiet'], {cwd: path});
    const before = process.cwd();
    cd(path);

    try {
      const output = await firstValueFrom(new GitStatus().invoke());

      expect(output).toEqual({
        type: 'success',
        value: {type: 'some', value: expect.stringContaining('No commits yet')},
      });
    } finally {
      cd(before);
    }
  });

  it('fails outside of a git repository', async () => {
    const path = await mkdtemp(join(tmpdir(), 'patka-git-'));
    const before = process.cwd();
    cd(path);

    try {
      expect(await firstValueFrom(new GitStatus().invoke())).toMatchObject({type: 'failure'});
    } finally {
      cd(before);
    }
  });

  it('does not run git until subscribed', () => {
    expect(() => new GitStatus().invoke()).not.toThrow();
  });
});
