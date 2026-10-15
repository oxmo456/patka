import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {injectable} from 'tsyringe';
import {$} from 'zx';
import {type Option, some} from '../../../../packages/option/option.ts';
import type {PatkaTool} from '../../../../packages/patka-agent/tools/patka-tool.ts';
import type {PatkaToolManual} from '../../../../packages/patka-agent/tools/patka-tool-manual.ts';
import {failure, success, type Try} from '../../../../packages/try/try.ts';

@injectable()
export class GitStatus implements PatkaTool<Record<string, never>, string> {
  readonly manual: PatkaToolManual = {
    name: 'git_status',
    summary: 'Shows the git status of the working directory.',
    usage: 'Use it to know which files are changed, staged or not tracked by git.',
    input: {
      type: 'object',
      properties: {},
      required: [],
    },
    output: {
      oneOf: [
        {
          type: 'object',
          description: 'The tool worked.',
          properties: {
            type: {const: 'success'},
            value: {
              type: 'object',
              properties: {
                type: {const: 'some'},
                value: {
                  type: 'string',
                  description: 'The text that "git status" prints.',
                },
              },
              required: ['type', 'value'],
            },
          },
          required: ['type', 'value'],
        },
        {
          type: 'object',
          description: 'The tool failed.',
          properties: {
            type: {const: 'failure'},
            error: {type: 'string', description: 'Why the tool failed.'},
          },
          required: ['type', 'error'],
        },
      ],
    },
  };

  invoke(): Observable<Try<Option<string>>> {
    return defer(() => from($`git -c color.ui=never status`.text())).pipe(
      map((value) => success(some(value))),
      catchError((error: Error) => of(failure(error))),
    );
  }
}
