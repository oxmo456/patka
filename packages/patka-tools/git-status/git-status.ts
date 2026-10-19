import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {$} from 'zx';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';
import {failure, success, type Try} from '../../try/try.ts';

export class GitStatus implements PatkaTool<Record<string, never>, string> {
  readonly name: string = 'git_status';
  readonly llmManual: PatkaToolLLMManual<Record<string, never>, string> = patkaToolLLMManual<
    Record<string, never>,
    string
  >(
    this.name,
    objectJsonSchemaLLMManual<Record<string, never>>(
      this.name,
      'Use it to know which files are changed, staged or not tracked by git.',
      {},
    ),
    propertyJsonSchemaLLMManual('string', 'The text that "git status" prints.'),
  );

  invoke(): Observable<Try<Option<string>>> {
    return defer(() => from($`git -c color.ui=never status`.text())).pipe(
      map((value) => success(some(value))),
      catchError((error: Error) => of(failure(error))),
    );
  }
}
