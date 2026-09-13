import {readdir} from 'node:fs/promises';
import {isAbsolute as isPathAbsolute} from 'node:path';
import {defer, from, map, type Observable} from 'rxjs';
import {injectable} from 'tsyringe';
import type {PatkaTool} from './patka-tool.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

export type ListFilesInput = {
  readonly path: string;
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
        path: {
          type: 'string',
          description: 'Path of the directory to list, relative to the working directory.',
        },
      },
      required: ['path'],
    },
    output: {
      type: 'array',
      description: 'The names of the files and directories found, directories ending with a slash.',
      items: {type: 'string'},
    },
  };

  invoke(listFilesInput: ListFilesInput): Observable<ReadonlyArray<string>> {
    return defer(() => {
      if (isPathAbsolute(listFilesInput.path)) {
        throw new Error(`list_files only accepts a relative path, given "${listFilesInput.path}"`);
      }

      return from(readdir(listFilesInput.path, {withFileTypes: true}));
    }).pipe(
      map((entries) =>
        entries.map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name)).sort(),
      ),
    );
  }
}
