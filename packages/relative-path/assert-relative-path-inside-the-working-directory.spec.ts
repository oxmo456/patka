import {mkdirSync, mkdtempSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {assertRelativePathInsideTheWorkingDirectory} from './assert-relative-path-inside-the-working-directory.ts';

describe('assertRelativePathInsideTheWorkingDirectory', () => {
  it('accepts the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));

    expect(() => assertRelativePathInsideTheWorkingDirectory(workingDirectory, './')).not.toThrow();
  });

  it('accepts a path inside the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(workingDirectory, 'src/utils'),
    ).not.toThrow();
  });

  it('accepts a name that starts with two dots', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(workingDirectory, '..notes'),
    ).not.toThrow();
  });

  it('accepts a file that does not exist yet inside the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(
        workingDirectory,
        'patka-missing/patka-missing.txt',
      ),
    ).not.toThrow();
  });

  it('refuses an absolute path', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));

    expect(() => assertRelativePathInsideTheWorkingDirectory(workingDirectory, tmpdir())).toThrow(
      `The tool only accepts a relative path, given "${tmpdir()}"`,
    );
  });

  it('refuses the parent directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));

    expect(() => assertRelativePathInsideTheWorkingDirectory(workingDirectory, '..')).toThrow(
      'The tool only accepts a path inside the working directory, given ".."',
    );
  });

  it('refuses a path that goes out of the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(workingDirectory, 'src/../../secrets'),
    ).toThrow(
      'The tool only accepts a path inside the working directory, given "src/../../secrets"',
    );
  });

  it('refuses a path that goes up even when it comes back inside the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(workingDirectory, 'src/../lib'),
    ).toThrow('The tool only accepts a path inside the working directory, given "src/../lib"');
  });

  it('refuses a symbolic link that points out of the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));
    symlinkSync(tmpdir(), join(workingDirectory, 'link'));

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(workingDirectory, 'link/secrets'),
    ).toThrow('The tool only accepts a path inside the working directory, given "link/secrets"');
  });

  it('refuses a dangling symbolic link that points out of the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));
    symlinkSync(join(tmpdir(), 'patka-missing.txt'), join(workingDirectory, 'link'));

    expect(() => assertRelativePathInsideTheWorkingDirectory(workingDirectory, 'link')).toThrow();
  });

  it('accepts a symbolic link that points inside the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));
    mkdirSync(join(workingDirectory, 'src'));
    symlinkSync(join(workingDirectory, 'src'), join(workingDirectory, 'link'));

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(workingDirectory, 'link/main.ts'),
    ).not.toThrow();
  });
});
