import {EMPTY, type Observable} from 'rxjs';
import {injectable} from 'tsyringe';
import type {PatkaTool} from './patka-tool.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

export type ReportIncompetencyInput = {
  readonly modelName: string;
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
        modelName: {
          type: 'string',
          description: 'Your own model name, as you know it.',
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
      required: ['modelName', 'request', 'rationale', 'toolSuggestion'],
    },
    output: {
      type: 'string',
      description: 'Nothing. The report ends the turn.',
    },
  };

  invoke(): Observable<string> {
    return EMPTY;
  }
}
