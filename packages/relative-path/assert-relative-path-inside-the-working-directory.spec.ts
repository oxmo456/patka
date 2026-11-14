import {memfs} from 'memfs';
import {describe, expect, it} from 'vitest';
import type {FileSystem} from '../file-system/file-system.ts';
import {assertRelativePathInsideTheWorkingDirectory} from './assert-relative-path-inside-the-working-directory.ts';

describe('assertRelativePathInsideTheWorkingDirectory', () => {
  it('accepts the working directory', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(fileSystem, '/work', './'),
    ).not.toThrow();
  });

  it('accepts a path inside the working directory', () => {
    const fileSystem = memfs({'/work/src/utils': null}).fs as unknown as FileSystem;

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(fileSystem, '/work', 'src/utils'),
    ).not.toThrow();
  });

  it('accepts a name that starts with two dots', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(fileSystem, '/work', '..notes'),
    ).not.toThrow();
  });

  it('accepts a file that does not exist yet inside the working directory', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(
        fileSystem,
        '/work',
        'patka-missing/patka-missing.txt',
      ),
    ).not.toThrow();
  });

  it('refuses an absolute path', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    expect(() => assertRelativePathInsideTheWorkingDirectory(fileSystem, '/work', '/tmp')).toThrow(
      'The tool only accepts a relative path, given "/tmp"',
    );
  });

  it('refuses the parent directory', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    expect(() => assertRelativePathInsideTheWorkingDirectory(fileSystem, '/work', '..')).toThrow(
      'The tool only accepts a path inside the working directory, given ".."',
    );
  });

  it('refuses a path that goes out of the working directory', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(fileSystem, '/work', 'src/../../secrets'),
    ).toThrow(
      'The tool only accepts a path inside the working directory, given "src/../../secrets"',
    );
  });

  it('refuses a path that goes up even when it comes back inside the working directory', () => {
    const fileSystem = memfs({'/work': null}).fs as unknown as FileSystem;

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(fileSystem, '/work', 'src/../lib'),
    ).toThrow('The tool only accepts a path inside the working directory, given "src/../lib"');
  });

  it('refuses a symbolic link that points out of the working directory', () => {
    const volume = memfs({'/work': null, '/secrets': null});
    volume.fs.symlinkSync('/secrets', '/work/link');
    const fileSystem = volume.fs as unknown as FileSystem;

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(fileSystem, '/work', 'link/passwords'),
    ).toThrow('The tool only accepts a path inside the working directory, given "link/passwords"');
  });

  it('refuses a dangling symbolic link that points out of the working directory', () => {
    const volume = memfs({'/work': null});
    volume.fs.symlinkSync('/patka-missing.txt', '/work/link');
    const fileSystem = volume.fs as unknown as FileSystem;

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(fileSystem, '/work', 'link'),
    ).toThrow();
  });

  it('accepts a symbolic link that points inside the working directory', () => {
    const volume = memfs({'/work/src': null});
    volume.fs.symlinkSync('/work/src', '/work/link');
    const fileSystem = volume.fs as unknown as FileSystem;

    expect(() =>
      assertRelativePathInsideTheWorkingDirectory(fileSystem, '/work', 'link/main.ts'),
    ).not.toThrow();
  });
});
