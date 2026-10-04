import {isAbsolute as isPathAbsolute} from 'node:path';
import {defer, from, map, type Observable} from 'rxjs';
import {injectable} from 'tsyringe';
import {$} from 'zx';
import {type Option, some} from '../../option.ts';
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
      type: 'string',
      description:
        'The text that "git diff" prints for the file. Empty when the file has no change.',
    },
  };

  invoke(gitDiffInput: GitDiffInput): Observable<Option<string>> {
    return defer(() => {
      if (isPathAbsolute(gitDiffInput.relativePath)) {
        throw new Error(
          `git_diff only accepts a relative path, given "${gitDiffInput.relativePath}"`,
        );
      }

      return from($`git diff -- ${gitDiffInput.relativePath}`.text());
    }).pipe(map(some));
  }
}
