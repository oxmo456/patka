import {
  basename,
  dirname,
  isAbsolute as isPathAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import type {FileSystem} from '../file-system/file-system.ts';

function hasParentSegment(relativePath: string): boolean {
  return relativePath.split(/[\\/]/).includes('..');
}

function isPresent(fileSystem: FileSystem, path: string): boolean {
  try {
    fileSystem.lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function createRealPathFromPath(fileSystem: FileSystem, path: string): string {
  if (isPresent(fileSystem, path)) {
    return fileSystem.realpathSync(path);
  }

  return join(createRealPathFromPath(fileSystem, dirname(path)), basename(path));
}

function isOutsideTheWorkingDirectory(
  fileSystem: FileSystem,
  workingDirectory: string,
  relativePath: string,
): boolean {
  const pathFromTheWorkingDirectory = relative(
    fileSystem.realpathSync(workingDirectory),
    createRealPathFromPath(fileSystem, resolve(workingDirectory, relativePath)),
  );

  return (
    pathFromTheWorkingDirectory === '..' ||
    pathFromTheWorkingDirectory.startsWith(`..${sep}`) ||
    isPathAbsolute(pathFromTheWorkingDirectory)
  );
}

export function assertRelativePathInsideTheWorkingDirectory(
  fileSystem: FileSystem,
  workingDirectory: string,
  relativePath: string,
): void {
  if (isPathAbsolute(relativePath)) {
    throw new Error(`The tool only accepts a relative path, given "${relativePath}"`);
  }

  if (
    hasParentSegment(relativePath) ||
    isOutsideTheWorkingDirectory(fileSystem, workingDirectory, relativePath)
  ) {
    throw new Error(
      `The tool only accepts a path inside the working directory, given "${relativePath}"`,
    );
  }
}
