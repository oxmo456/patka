import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {$} from 'zx';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import type {PatkaToolManual} from '../../patka-tool/patka-tool-manual.ts';
import {input, output, patkaToolManual, string} from '../../patka-tool/patka-tool-manual.ts';
import {failure, success, type Try} from '../../try/try.ts';

export class GitStatus implements PatkaTool<Record<string, never>, string> {
  readonly manual: PatkaToolManual = patkaToolManual(
    'git_status',
    'Shows the git status of the working directory.',
    'Use it to know which files are changed, staged or not tracked by git.',
    input(),
    output(string('The text that "git status" prints.')),
  );

  invoke(): Observable<Try<Option<string>>> {
    return defer(() => from($`git -c color.ui=never status`.text())).pipe(
      map((value) => success(some(value))),
      catchError((error: Error) => of(failure(error))),
    );
  }
}
