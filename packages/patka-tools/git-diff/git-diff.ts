import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {$} from 'zx';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../patka-tool/patka-tool-relative-path.ts';
import {input} from '../../patka-tool-llm-manual/input.ts';
import {output} from '../../patka-tool-llm-manual/output.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {property} from '../../patka-tool-llm-manual/property.ts';
import {string} from '../../patka-tool-llm-manual/string.ts';
import {failure, success, type Try} from '../../try/try.ts';

export type GitDiffInput = {
  readonly relativePath: string;
};

export class GitDiff implements PatkaTool<GitDiffInput, string> {
  readonly llmManual: PatkaToolLLMManual = patkaToolLLMManual(
    'git_diff',
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
