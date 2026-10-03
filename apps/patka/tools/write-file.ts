import {writeFile} from 'node:fs/promises';
import {isAbsolute as isPathAbsolute} from 'node:path';
import {defer, from, map, type Observable} from 'rxjs';
import {injectable} from 'tsyringe';
import {type Option, some} from '../option.ts';
import type {PatkaTool} from './patka-tool.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

export type WriteFileInput = {
  readonly path: string;
  readonly content: string;
};

@injectable()
export class WriteFile implements PatkaTool<WriteFileInput, string> {
  readonly manual: PatkaToolManual = {
    name: 'write_file',
    summary: 'Writes text to a file, replacing what the file held.',
    usage: 'Use it once you know the path of the file and the whole text it must hold.',
    input: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path of the file to write, relative to the working directory.',
        },
        content: {
          type: 'string',
          description: 'The whole text the file must hold.',
        },
      },
      required: ['path', 'content'],
    },
    output: {
      type: 'string',
      description: 'The path of the file that was written.',
    },
  };

  invoke(writeFileInput: WriteFileInput): Observable<Option<string>> {
    return defer(() => {
      if (isPathAbsolute(writeFileInput.path)) {
        throw new Error(`write_file only accepts a relative path, given "${writeFileInput.path}"`);
      }

      return from(writeFile(writeFileInput.path, writeFileInput.content, 'utf8')).pipe(
        map(() => some(writeFileInput.path)),
      );
    });
  }
}
