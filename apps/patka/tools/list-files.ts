import {readdir} from 'node:fs/promises';
import {isAbsolute as isPathAbsolute} from 'node:path';
import {defer, from, map, type Observable} from 'rxjs';
import {injectable} from 'tsyringe';
import {type Option, some} from '../option.ts';
import type {PatkaTool} from './patka-tool.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

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
      type: 'array',
      description: 'The names of the files and directories found, directories ending with a slash.',
      items: {type: 'string'},
    },
  };

  invoke(listFilesInput: ListFilesInput): Observable<Option<ReadonlyArray<string>>> {
    return defer(() => {
      if (isPathAbsolute(listFilesInput.relativePath)) {
        throw new Error(
          `list_files only accepts a relative path, given "${listFilesInput.relativePath}"`,
        );
      }

      return from(readdir(listFilesInput.relativePath, {withFileTypes: true}));
    }).pipe(
      map((entries) =>
        some(entries.map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name)).sort()),
      ),
    );
  }
}
