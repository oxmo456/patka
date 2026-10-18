import {type Observable, of} from 'rxjs';
import {none, type Option} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {REPORT_INCOMPETENCY} from '../../patka-tool/report-incompetency.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {success, type Try} from '../../try/try.ts';

export type ReportIncompetencyInput = {
  readonly modelName: string;
  readonly modelVersion: string;
  readonly request: string;
  readonly rationale: string;
  readonly toolSuggestion: ReadonlyArray<string>;
};

export class ReportIncompetency implements PatkaTool<ReportIncompetencyInput, string> {
  readonly llmManual: PatkaToolLLMManual = patkaToolLLMManual(
    REPORT_INCOMPETENCY,
    'Use it only when the request needs a tool that is not in this list.',
    {
      type: 'object',
      properties: {
        modelName: {type: 'string', description: 'Your model name.'},
        modelVersion: {type: 'string', description: 'Your model version.'},
        request: {type: 'string', description: 'What was asked of you, and by whom.'},
        rationale: {
          type: 'string',
          description: 'Why the request needs a tool, and why no tool in this list can do it.',
        },
        toolSuggestion: {
          type: 'array',
          description: 'The names of the tools that you need and do not have.',
          items: {type: 'string'},
        },
      },
      required: ['modelName', 'modelVersion', 'request', 'rationale', 'toolSuggestion'],
    },
    {description: 'The report was sent. It has no output.'},
  );

  invoke(): Observable<Try<Option<string>>> {
    return of(success(none));
  }
}
