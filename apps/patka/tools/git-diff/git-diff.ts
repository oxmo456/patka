import {isAbsolute as isPathAbsolute} from 'node:path';
import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {injectable} from 'tsyringe';
import {$} from 'zx';
import {type Option, some} from '../../option.ts';
import {failure, success, type Try} from '../../try.ts';
import type {PatkaTool} from '../patka-tool.ts';
import type {PatkaToolManual} from '../patka-tool-manual.ts';

export type GitDiffInput = {
  readonly relativePath: string;
};

@injectable()
export class GitDiff implements PatkaTool<GitDiffInput, string> {
  readonly manual: PatkaToolManual = {
    name: 'git_diff',
    summary: 'Shows the git diff of one file: its changes not yet staged.',
    usage: 'Use it to see what changed in a file that git status shows as modified.',
    input: {
      type: 'object',
      properties: {
        relativePath: {
          type: 'string',
          description:
            'Relative path of the file to diff, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path: a path starting with "/" is refused.',
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
                  description:
                    'The text that "git diff" prints for the file. Empty when the file has no change.',
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

  invoke(gitDiffInput: GitDiffInput): Observable<Try<Option<string>>> {
    return defer(() => {
      if (isPathAbsolute(gitDiffInput.relativePath)) {
        throw new Error(
          `git_diff only accepts a relative path, given "${gitDiffInput.relativePath}"`,
        );
      }

      return from($`git -c color.ui=never diff -- ${gitDiffInput.relativePath}`.text());
    }).pipe(
      map((value) => success(some(value))),
      catchError((error: Error) => of(failure(error))),
    );
  }
}
