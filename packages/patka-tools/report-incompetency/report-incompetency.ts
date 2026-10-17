import {type Observable, of} from 'rxjs';
import {none, type Option} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {REPORT_INCOMPETENCY} from '../../patka-tool/report-incompetency.ts';
import {array} from '../../patka-tool-llm-manual/array.ts';
import {input} from '../../patka-tool-llm-manual/input.ts';
import {noOutput} from '../../patka-tool-llm-manual/no-output.ts';
import {object} from '../../patka-tool-llm-manual/object.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {property} from '../../patka-tool-llm-manual/property.ts';
import {string} from '../../patka-tool-llm-manual/string.ts';
import {success, type Try} from '../../try/try.ts';

export type ReportIncompetencyInput = {
  readonly model: {
    readonly name: string;
    readonly version: string;
  };
  readonly request: string;
  readonly rationale: string;
  readonly toolSuggestion: ReadonlyArray<string>;
};

export class ReportIncompetency implements PatkaTool<ReportIncompetencyInput, string> {
  readonly llmManual: PatkaToolLLMManual = patkaToolLLMManual(
    REPORT_INCOMPETENCY,
    'Use it only when the request needs a tool that is not in this list.',
    input(
      property(
        'model',
        object(
          'Yourself, as you know it.',
          property('name', string('Your model name.')),
          property('version', string('Your model version.')),
        ),
      ),
      property('request', string('What was asked of you, and by whom.')),
      property(
        'rationale',
        string('Why the request needs a tool, and why no tool in this list can do it.'),
      ),
      property(
        'toolSuggestion',
        array('The names of the tools that you need and do not have.', string()),
      ),
    ),
    noOutput('The report was sent. It has no output.'),
  );

  invoke(): Observable<Try<Option<string>>> {
    return of(success(none));
  }
}
