import {readFile} from 'node:fs/promises';
import {isAbsolute as isPathAbsolute} from 'node:path';
import {defer, from, map, type Observable} from 'rxjs';
import {injectable} from 'tsyringe';
import {type Option, some} from '../option.ts';
import type {PatkaTool} from './patka-tool.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

export type ReadFileInput = {
  readonly relativePath: string;
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
        relativePath: {
          type: 'string',
          description:
            'Relative path of the file to read, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path: a path starting with "/" is refused.',
        },
      },
      required: ['relativePath'],
    },
    output: {
      type: 'string',
      description: 'The whole contents of the file, as text.',
    },
  };

  invoke(readFileInput: ReadFileInput): Observable<Option<string>> {
    return defer(() => {
      if (isPathAbsolute(readFileInput.relativePath)) {
        throw new Error(
          `read_file only accepts a relative path, given "${readFileInput.relativePath}"`,
        );
      }

      return from(readFile(readFileInput.relativePath, 'utf8')).pipe(map(some));
    });
  }
}
