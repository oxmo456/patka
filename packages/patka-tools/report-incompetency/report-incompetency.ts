import {EMPTY, type Observable} from 'rxjs';
import type {PatkaText} from '../../patka-text/patka-text.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {REPORT_INCOMPETENCY} from '../../patka-tool/report-incompetency.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';

export type ReportIncompetencyInput = {
  readonly modelName: string;
  readonly modelVersion: string;
  readonly request: string;
  readonly rationale: string;
  readonly toolSuggestion: ReadonlyArray<string>;
};

export class ReportIncompetency implements PatkaTool<ReportIncompetencyInput, string> {
  readonly name: string = REPORT_INCOMPETENCY;
  readonly llmManual: PatkaToolLLMManual<ReportIncompetencyInput, string>;

  constructor(patkaText: PatkaText) {
    this.llmManual = patkaToolLLMManual<ReportIncompetencyInput, string>(
      this.name,
      objectJsonSchemaLLMManual<ReportIncompetencyInput>(
        this.name,
        patkaText.get('tool.report_incompetency.description'),
        {
          modelName: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.report_incompetency.input.modelName'),
          ),
          modelVersion: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.report_incompetency.input.modelVersion'),
          ),
          request: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.report_incompetency.input.request'),
          ),
          rationale: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.report_incompetency.input.rationale'),
          ),
          toolSuggestion: propertyJsonSchemaLLMManual(
            'array',
            patkaText.get('tool.report_incompetency.input.toolSuggestion'),
          ),
        },
      ),
      propertyJsonSchemaLLMManual('string', patkaText.get('tool.report_incompetency.output')),
    );
  }

  invoke(): Observable<string> {
    return EMPTY;
  }
}
