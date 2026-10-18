import {type Observable, of} from 'rxjs';
import {none, type Option} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {REPORT_INCOMPETENCY} from '../../patka-tool/report-incompetency.ts';
import {patkaToolInputLLMManual} from '../../patka-tool-llm-manual/patka-tool-input-llm-manual.ts';
import {patkaToolInputPropertyLLMManual} from '../../patka-tool-llm-manual/patka-tool-input-property-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManualNoOutput} from '../../patka-tool-llm-manual/patka-tool-llm-manual-no-output.ts';
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
    patkaToolInputLLMManual(
      patkaToolInputPropertyLLMManual('modelName', 'string', 'Your model name.'),
      patkaToolInputPropertyLLMManual('modelVersion', 'string', 'Your model version.'),
      patkaToolInputPropertyLLMManual('request', 'string', 'What was asked of you, and by whom.'),
      patkaToolInputPropertyLLMManual(
        'rationale',
        'string',
        'Why the request needs a tool, and why no tool in this list can do it.',
      ),
      patkaToolInputPropertyLLMManual(
        'toolSuggestion',
        'array',
        'The names of the tools that you need and do not have.',
      ),
    ),
    patkaToolLLMManualNoOutput('The report was sent. It has no output.'),
  );

  invoke(): Observable<Try<Option<string>>> {
    return of(success(none));
  }
}
