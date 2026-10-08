import {writeFile} from 'node:fs/promises';
import {isAbsolute as isPathAbsolute} from 'node:path';
import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {injectable} from 'tsyringe';
import {type Option, some} from '../../option.ts';
import {failure, success, type Try} from '../../try.ts';
import type {PatkaTool} from '../patka-tool.ts';
import type {PatkaToolManual} from '../patka-tool-manual.ts';

export type WriteFileInput = {
  readonly relativePath: string;
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
        relativePath: {
          type: 'string',
          description:
            'Relative path of the file to write, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path: a path starting with "/" is refused.',
        },
        content: {
          type: 'string',
          description: 'The whole text the file must hold.',
        },
      },
      required: ['relativePath', 'content'],
    },
    output: {
      oneOf: [
        {
          type: 'object',
          description: 'The tool worked.',
          properties: {
            type: {const: 'success'},
            value: {
              type: 'object',
              properties: {
                type: {const: 'some'},
                value: {
                  type: 'string',
                  description: 'The path of the file that was written.',
                },
              },
              required: ['type', 'value'],
            },
          },
          required: ['type', 'value'],
        },
        {
          type: 'object',
          description: 'The tool failed.',
          properties: {
            type: {const: 'failure'},
            error: {type: 'string', description: 'Why the tool failed.'},
          },
          required: ['type', 'error'],
        },
      ],
    },
  };

  invoke(writeFileInput: WriteFileInput): Observable<Try<Option<string>>> {
    return defer(() => {
      if (isPathAbsolute(writeFileInput.relativePath)) {
        throw new Error(
          `write_file only accepts a relative path, given "${writeFileInput.relativePath}"`,
        );
      }

      return from(writeFile(writeFileInput.relativePath, writeFileInput.content, 'utf8')).pipe(
        map(() => success(some(writeFileInput.relativePath))),
      );
    }).pipe(catchError((error: Error) => of(failure(error))));
  }
}
