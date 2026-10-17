import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {$} from 'zx';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-agent/tools/patka-tool.ts';
import type {PatkaToolManual} from '../../patka-agent/tools/patka-tool-manual.ts';
import {
  input,
  output,
  patkaToolManual,
  property,
  string,
} from '../../patka-agent/tools/patka-tool-manual.ts';
import {failure, success, type Try} from '../../try/try.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../patka-tool-relative-path.ts';

export type GitDiffInput = {
  readonly relativePath: string;
};

export class GitDiff implements PatkaTool<GitDiffInput, string> {
  readonly manual: PatkaToolManual = patkaToolManual(
    'git_diff',
    'Shows the git diff of one file: its changes not yet staged.',
    'Use it to see what changed in a file that git status shows as modified.',
    input(
      property(
        'relativePath',
        string(
          'Relative path of the file to diff, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path and never outside the working directory: such a path is refused.',
        ),
      ),
    ),
    output(
      string('The text that "git diff" prints for the file. Empty when the file has no change.'),
    ),
  );

  invoke(gitDiffInput: GitDiffInput): Observable<Try<Option<string>>> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(gitDiffInput.relativePath);

      return from($`git -c color.ui=never diff -- ${gitDiffInput.relativePath}`.text());
    }).pipe(
      map((value) => success(some(value))),
      catchError((error: Error) => of(failure(error))),
    );
  }
}
