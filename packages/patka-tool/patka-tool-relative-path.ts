import {isAbsolute as isPathAbsolute, relative, resolve} from 'node:path';

function isOutsideTheWorkingDirectory(relativePath: string): boolean {
  const pathFromTheWorkingDirectory = relative(process.cwd(), resolve(relativePath));

  return pathFromTheWorkingDirectory === '..' || pathFromTheWorkingDirectory.startsWith('../');
}

export function assertRelativePathInsideTheWorkingDirectory(relativePath: string): void {
  if (isPathAbsolute(relativePath)) {
    throw new Error(`The tool only accepts a relative path, given "${relativePath}"`);
  }

  if (isOutsideTheWorkingDirectory(relativePath)) {
    throw new Error(
      `The tool only accepts a path inside the working directory, given "${relativePath}"`,
    );
  }
}
