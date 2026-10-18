import {catchError, defer, type Observable, of} from 'rxjs';
import {$} from 'zx';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {patkaToolInputLLMManual} from '../../patka-tool-llm-manual/patka-tool-input-llm-manual.ts';
import {patkaToolInputPropertyLLMManual} from '../../patka-tool-llm-manual/patka-tool-input-property-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolOutputLLMManual} from '../../patka-tool-llm-manual/patka-tool-output-llm-manual.ts';
import {failure, success, type Try} from '../../try/try.ts';

export type ApplyPatchInput = {
  readonly patch: string;
};

export class ApplyPatch implements PatkaTool<ApplyPatchInput, string> {
  readonly llmManual: PatkaToolLLMManual = patkaToolLLMManual(
    'apply_patch',
    'Use it to change part of a file without writing the whole file again. Read the file first, so the context lines of the patch are exact.',
    patkaToolInputLLMManual(
      patkaToolInputPropertyLLMManual(
        'patch',
        'string',
        'A unified diff, as "git diff" prints it. Paths are relative to the working directory, with the "a/" and "b/" prefixes (e.g. "--- a/src/main.ts" and "+++ b/src/main.ts"). Use "--- /dev/null" to create a file and "+++ /dev/null" to delete one.',
      ),
    ),
    patkaToolOutputLLMManual(
      'string',
      'What git prints: one line per file it checked and applied, and any warning.',
    ),
  );

  invoke(applyPatchInput: ApplyPatchInput): Observable<Try<Option<string>>> {
    return defer(async () => {
      const processOutput = await $({
        input: applyPatchInput.patch,
        nothrow: true,
      })`git apply --recount --verbose`;

      return processOutput.exitCode === 0
        ? success(some(processOutput.stdall))
        : failure(new Error(processOutput.stdall));
    }).pipe(catchError((error: Error) => of(failure(error))));
  }
}
