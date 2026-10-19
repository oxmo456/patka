import {type Observable, of} from 'rxjs';
import {none, type Option} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {REPORT_INCOMPETENCY} from '../../patka-tool/report-incompetency.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';
import {success, type Try} from '../../try/try.ts';

export type ReportIncompetencyInput = {
  readonly modelName: string;
  readonly modelVersion: string;
  readonly request: string;
  readonly rationale: string;
  readonly toolSuggestion: ReadonlyArray<string>;
};

export class ReportIncompetency implements PatkaTool<ReportIncompetencyInput, string> {
  readonly name: string = REPORT_INCOMPETENCY;
  readonly llmManual: PatkaToolLLMManual<ReportIncompetencyInput, string> = patkaToolLLMManual<
    ReportIncompetencyInput,
    string
  >(
    this.name,
    objectJsonSchemaLLMManual<ReportIncompetencyInput>(
      this.name,
      'Use it only when the request needs a tool that is not in this list.',
      {
        modelName: propertyJsonSchemaLLMManual('string', 'Your model name.'),
        modelVersion: propertyJsonSchemaLLMManual('string', 'Your model version.'),
        request: propertyJsonSchemaLLMManual('string', 'What was asked of you, and by whom.'),
        rationale: propertyJsonSchemaLLMManual(
          'string',
          'Why the request needs a tool, and why no tool in this list can do it.',
        ),
        toolSuggestion: propertyJsonSchemaLLMManual(
          'array',
          'The names of the tools that you need and do not have.',
        ),
      },
    ),
    propertyJsonSchemaLLMManual('string', 'The report was sent. It has no output.'),
  );

  invoke(): Observable<Try<Option<string>>> {
    return of(success(none));
  }
}
