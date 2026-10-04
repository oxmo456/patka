import {type Observable, of} from 'rxjs';
import {injectable} from 'tsyringe';
import {none, type Option} from '../../option.ts';
import type {PatkaTool} from '../patka-tool.ts';
import type {PatkaToolManual} from '../patka-tool-manual.ts';

export type ReportIncompetencyInput = {
  readonly model: {
    readonly name: string;
    readonly version: string;
  };
  readonly request: string;
  readonly rationale: string;
  readonly toolSuggestion: ReadonlyArray<string>;
};

@injectable()
export class ReportIncompetency implements PatkaTool<ReportIncompetencyInput, string> {
  readonly manual: PatkaToolManual = {
    name: 'report_incompetency',
    summary: 'Tells whoever asked that you have no tool for the job.',
    usage: 'Use it only when the request needs a tool that is not in this list.',
    input: {
      type: 'object',
      properties: {
        model: {
          type: 'object',
          description: 'Yourself, as you know it.',
          properties: {
            name: {type: 'string', description: 'Your model name.'},
            version: {type: 'string', description: 'Your model version.'},
          },
          required: ['name', 'version'],
        },
        request: {
          type: 'string',
          description: 'What was asked of you, and by whom.',
        },
        rationale: {
          type: 'string',
          description: 'Why the request needs a tool, and why no tool in this list can do it.',
        },
        toolSuggestion: {
          type: 'array',
          items: {type: 'string'},
          description: 'The names of the tools that you need and do not have.',
        },
      },
      required: ['model', 'request', 'rationale', 'toolSuggestion'],
    },
    output: {
      type: 'string',
      description: 'Nothing. The report has no output.',
    },
  };

  invoke(): Observable<Option<string>> {
    return of(none);
  }
}
