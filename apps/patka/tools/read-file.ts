import {readFile} from 'node:fs/promises';
import {isAbsolute as isPathAbsolute} from 'node:path';
import {defer, from, type Observable} from 'rxjs';
import {injectable} from 'tsyringe';
import type {PatkaTool} from './patka-tool.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

export type ReadFileInput = {
  readonly path: string;
};

@injectable()
export class ReadFile implements PatkaTool<ReadFileInput, string> {
  readonly manual: PatkaToolManual = {
    name: 'read_file',
    summary: 'Reads the whole contents of a file.',
    usage: 'Use it once you know the path of the file you need to read.',
    input: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path of the file to read, relative to the working directory.',
        },
      },
      required: ['path'],
    },
    output: {
      type: 'string',
      description: 'The whole contents of the file, as text.',
    },
  };

  invoke(readFileInput: ReadFileInput): Observable<string> {
    return defer(() => {
      if (isPathAbsolute(readFileInput.path)) {
        throw new Error(`read_file only accepts a relative path, given "${readFileInput.path}"`);
      }

      return from(readFile(readFileInput.path, 'utf8'));
    });
  }
}
