import {readdir} from 'node:fs/promises';
import {isAbsolute as isPathAbsolute} from 'node:path';
import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {injectable} from 'tsyringe';
import {type Option, some} from '../../option.ts';
import {failure, success, type Try} from '../../try.ts';
import type {PatkaTool} from '../patka-tool.ts';
import type {PatkaToolManual} from '../patka-tool-manual.ts';

export type ListFilesInput = {
  readonly relativePath: string;
};

@injectable()
export class ListFiles implements PatkaTool<ListFilesInput, ReadonlyArray<string>> {
  readonly manual: PatkaToolManual = {
    name: 'list_files',
    summary: 'Lists the files and directories directly under a path.',
    usage: 'Use it to discover what a directory holds before reading any file.',
    input: {
      type: 'object',
      properties: {
        relativePath: {
          type: 'string',
          description:
            'Relative path of the directory to list, from the working directory (e.g. "." or "src/utils"). Never an absolute path: a path starting with "/" is refused.',
        },
      },
      required: ['relativePath'],
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
                  type: 'array',
                  description:
                    'The names of the files and directories found, directories ending with a slash.',
                  items: {type: 'string'},
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

  invoke(listFilesInput: ListFilesInput): Observable<Try<Option<ReadonlyArray<string>>>> {
    return defer(() => {
      if (isPathAbsolute(listFilesInput.relativePath)) {
        throw new Error(
          `list_files only accepts a relative path, given "${listFilesInput.relativePath}"`,
        );
      }

      return from(readdir(listFilesInput.relativePath, {withFileTypes: true}));
    }).pipe(
      map((entries) =>
        success(
          some(
            entries.map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name)).sort(),
          ),
        ),
      ),
      catchError((error: Error) => of(failure(error))),
    );
  }
}
