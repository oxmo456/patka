import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {$} from 'zx';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {input} from '../../patka-tool-llm-manual/input.ts';
import {output} from '../../patka-tool-llm-manual/output.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {string} from '../../patka-tool-llm-manual/string.ts';
import {failure, success, type Try} from '../../try/try.ts';

export class GitStatus implements PatkaTool<Record<string, never>, string> {
  readonly llmManual: PatkaToolLLMManual = patkaToolLLMManual(
    'git_status',
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
