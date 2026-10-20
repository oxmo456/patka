import {defer, type Observable} from 'rxjs';
import {$} from 'zx';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';

export type ApplyPatchInput = {
  readonly patch: string;
};

export class ApplyPatch implements PatkaTool<ApplyPatchInput, string> {
  readonly name: string = 'apply_patch';
  readonly llmManual: PatkaToolLLMManual<ApplyPatchInput, string> = patkaToolLLMManual<
    ApplyPatchInput,
    string
  >(
    this.name,
    objectJsonSchemaLLMManual<ApplyPatchInput>(
      this.name,
      'Use it to change part of a file without writing the whole file again. Read the file first, so the context lines of the patch are exact.',
      {
        patch: propertyJsonSchemaLLMManual(
          'string',
          'A unified diff, as "git diff" prints it. Paths are relative to the working directory, with the "a/" and "b/" prefixes (e.g. "--- a/src/main.ts" and "+++ b/src/main.ts"). Use "--- /dev/null" to create a file and "+++ /dev/null" to delete one.',
        ),
      },
    ),
    propertyJsonSchemaLLMManual(
      'string',
      'What git prints: one line per file it checked and applied, and any warning.',
    ),
  );

  invoke(applyPatchInput: ApplyPatchInput): Observable<string> {
    return defer(async () => {
      const processOutput = await $({
        input: applyPatchInput.patch,
        nothrow: true,
      })`git apply --recount --verbose`;

      if (processOutput.exitCode !== 0) {
        throw new Error(processOutput.stdall);
      }

      return processOutput.stdall;
    });
  }
}
