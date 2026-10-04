import {defer, from, map, type Observable} from 'rxjs';
import {injectable} from 'tsyringe';
import {$} from 'zx';
import {type Option, some} from '../../option.ts';
import type {PatkaTool} from '../patka-tool.ts';
import type {PatkaToolManual} from '../patka-tool-manual.ts';

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
      type: 'string',
      description: 'The text that "git status" prints.',
    },
  };

  invoke(): Observable<Option<string>> {
    return defer(() => from($`git status`.text())).pipe(map(some));
  }
}
