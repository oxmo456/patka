import {type Observable, of} from 'rxjs';
import {none, type Option} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import type {PatkaToolManual} from '../../patka-tool/patka-tool-manual.ts';
import {
  array,
  input,
  noOutput,
  object,
  patkaToolManual,
  property,
  string,
} from '../../patka-tool/patka-tool-manual.ts';
import {REPORT_INCOMPETENCY} from '../../patka-tool/report-incompetency.ts';
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
  readonly manual: PatkaToolManual = patkaToolManual(
    REPORT_INCOMPETENCY,
    'Tells whoever asked that you have no tool for the job.',
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
