import {readFile} from 'node:fs/promises';
import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {injectable} from 'tsyringe';
import type {PatkaTool} from '../../../../packages/agent/tools/patka-tool.ts';
import type {PatkaToolManual} from '../../../../packages/agent/tools/patka-tool-manual.ts';
import {type Option, some} from '../../../../packages/option/option.ts';
import {failure, success, type Try} from '../../../../packages/try/try.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../patka-tool-relative-path.ts';

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
            'Relative path of the file to read, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path and never outside the working directory: such a path is refused.',
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
                  type: 'string',
                  description: 'The whole contents of the file, as text.',
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

  invoke(readFileInput: ReadFileInput): Observable<Try<Option<string>>> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(readFileInput.relativePath);

      return from(readFile(readFileInput.relativePath, 'utf8')).pipe(
        map((value) => success(some(value))),
      );
    }).pipe(catchError((error: Error) => of(failure(error))));
  }
}
