import {mkdirSync, mkdtempSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {assertRelativePathInsideTheWorkingDirectory} from './assert-relative-path-inside-the-working-directory.ts';

describe('assertRelativePathInsideTheWorkingDirectory', () => {
  it('accepts the working directory', () => {
    expect(() => assertRelativePathInsideTheWorkingDirectory('./')).not.toThrow();
  });

  it('accepts a path inside the working directory', () => {
    expect(() => assertRelativePathInsideTheWorkingDirectory('src/utils')).not.toThrow();
  });

  it('refuses a path that goes up even when it comes back inside the working directory', () => {
    expect(() => assertRelativePathInsideTheWorkingDirectory('src/../lib')).toThrow(
      'The tool only accepts a path inside the working directory, given "src/../lib"',
    );
  });

  it('accepts a file that does not exist yet inside the working directory', () => {
    expect(() =>
      assertRelativePathInsideTheWorkingDirectory('patka-missing/patka-missing.txt'),
    ).not.toThrow();
  });

  it('refuses a symbolic link that points out of the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));
    symlinkSync(tmpdir(), join(workingDirectory, 'link'));
    const before = process.cwd();
    process.chdir(workingDirectory);

    try {
      expect(() => assertRelativePathInsideTheWorkingDirectory('link/secrets')).toThrow(
        'The tool only accepts a path inside the working directory, given "link/secrets"',
      );
    } finally {
      process.chdir(before);
    }
  });

  it('refuses a dangling symbolic link that points out of the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));
    symlinkSync(join(tmpdir(), 'patka-missing.txt'), join(workingDirectory, 'link'));
    const before = process.cwd();
    process.chdir(workingDirectory);

    try {
      expect(() => assertRelativePathInsideTheWorkingDirectory('link')).toThrow();
    } finally {
      process.chdir(before);
    }
  });

  it('accepts a symbolic link that points inside the working directory', () => {
    const workingDirectory = mkdtempSync(join(tmpdir(), 'patka-relative-path-'));
    mkdirSync(join(workingDirectory, 'src'));
    symlinkSync(join(workingDirectory, 'src'), join(workingDirectory, 'link'));
    const before = process.cwd();
    process.chdir(workingDirectory);

    try {
      expect(() => assertRelativePathInsideTheWorkingDirectory('link/main.ts')).not.toThrow();
    } finally {
      process.chdir(before);
    }
  });

  it('accepts a name that starts with two dots', () => {
    expect(() => assertRelativePathInsideTheWorkingDirectory('..notes')).not.toThrow();
  });

  it('refuses an absolute path', () => {
    expect(() => assertRelativePathInsideTheWorkingDirectory(tmpdir())).toThrow(
      `The tool only accepts a relative path, given "${tmpdir()}"`,
    );
  });

  it('refuses the parent directory', () => {
    expect(() => assertRelativePathInsideTheWorkingDirectory('..')).toThrow(
      'The tool only accepts a path inside the working directory, given ".."',
    );
  });

  it('refuses a path that goes out of the working directory', () => {
    expect(() => assertRelativePathInsideTheWorkingDirectory('src/../../secrets')).toThrow(
      'The tool only accepts a path inside the working directory, given "src/../../secrets"',
    );
  });
});
