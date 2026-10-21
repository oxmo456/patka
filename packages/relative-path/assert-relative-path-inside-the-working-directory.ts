import {lstatSync, realpathSync} from 'node:fs';
import {
  basename,
  dirname,
  isAbsolute as isPathAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';

function hasParentSegment(relativePath: string): boolean {
  return relativePath.split(/[\\/]/).includes('..');
}

function isPresent(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function createRealPathFromPath(path: string): string {
  if (isPresent(path)) {
    return realpathSync(path);
  }

  return join(createRealPathFromPath(dirname(path)), basename(path));
}

function isOutsideTheWorkingDirectory(workingDirectory: string, relativePath: string): boolean {
  const pathFromTheWorkingDirectory = relative(
    realpathSync(workingDirectory),
    createRealPathFromPath(resolve(workingDirectory, relativePath)),
  );

  return (
    pathFromTheWorkingDirectory === '..' ||
    pathFromTheWorkingDirectory.startsWith(`..${sep}`) ||
    isPathAbsolute(pathFromTheWorkingDirectory)
  );
}

export function assertRelativePathInsideTheWorkingDirectory(
  workingDirectory: string,
  relativePath: string,
): void {
  if (isPathAbsolute(relativePath)) {
    throw new Error(`The tool only accepts a relative path, given "${relativePath}"`);
  }

  if (
    hasParentSegment(relativePath) ||
    isOutsideTheWorkingDirectory(workingDirectory, relativePath)
  ) {
    throw new Error(
      `The tool only accepts a path inside the working directory, given "${relativePath}"`,
    );
  }
}
