import {tmpdir} from 'node:os';
import {describe, expect, it} from 'vitest';
import {assertRelativePathInsideTheWorkingDirectory} from './patka-tool-relative-path.ts';

describe('assertRelativePathInsideTheWorkingDirectory', () => {
  it('accepts the working directory', () => {
    expect(() => assertRelativePathInsideTheWorkingDirectory('./')).not.toThrow();
  });

  it('accepts a path inside the working directory', () => {
    expect(() => assertRelativePathInsideTheWorkingDirectory('src/utils')).not.toThrow();
  });

  it('accepts a path that goes up and comes back inside the working directory', () => {
    expect(() => assertRelativePathInsideTheWorkingDirectory('src/../lib')).not.toThrow();
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
