import {defer, type Observable} from 'rxjs';
import {$} from 'zx';
import type {PatkaText} from '../../patka-text/patka-text.ts';
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
  readonly llmManual: PatkaToolLLMManual<ApplyPatchInput, string>;

  private readonly workingDirectory: string;

  constructor(workingDirectory: string, patkaText: PatkaText) {
    this.workingDirectory = workingDirectory;
    this.llmManual = patkaToolLLMManual<ApplyPatchInput, string>(
      this.name,
      objectJsonSchemaLLMManual<ApplyPatchInput>(
        this.name,
        patkaText.get('tool.apply_patch.description'),
        {
          patch: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.apply_patch.input.patch'),
          ),
        },
      ),
      propertyJsonSchemaLLMManual('string', patkaText.get('tool.apply_patch.output')),
    );
  }

  invoke(applyPatchInput: ApplyPatchInput): Observable<string> {
    return defer(async () => {
      const processOutput = await $({
        cwd: this.workingDirectory,
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
