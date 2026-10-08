import {catchError, defer, type Observable, of} from 'rxjs';
import {injectable} from 'tsyringe';
import {$} from 'zx';
import {type Option, some} from '../../option.ts';
import {failure, success, type Try} from '../../try.ts';
import type {PatkaTool} from '../patka-tool.ts';
import type {PatkaToolManual} from '../patka-tool-manual.ts';

export type ApplyPatchInput = {
  readonly patch: string;
};

@injectable()
export class ApplyPatch implements PatkaTool<ApplyPatchInput, string> {
  readonly manual: PatkaToolManual = {
    name: 'apply_patch',
    summary: 'Applies a unified diff to the files: creates, changes or deletes them.',
    usage:
      'Use it to change part of a file without writing the whole file again. Read the file first, so the context lines of the patch are exact.',
    input: {
      type: 'object',
      properties: {
        patch: {
          type: 'string',
          description:
            'A unified diff, as "git diff" prints it. Paths are relative to the working directory, with the "a/" and "b/" prefixes (e.g. "--- a/src/main.ts" and "+++ b/src/main.ts"). Use "--- /dev/null" to create a file and "+++ /dev/null" to delete one.',
        },
      },
      required: ['patch'],
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
                  description:
                    'What git prints: one line per file it checked and applied, and any warning.',
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

  invoke(applyPatchInput: ApplyPatchInput): Observable<Try<Option<string>>> {
    return defer(async () => {
      const processOutput = await $({
        input: applyPatchInput.patch,
        nothrow: true,
      })`git apply --recount --verbose`;

      return processOutput.exitCode === 0
        ? success(some(processOutput.stdall))
        : failure(new Error(processOutput.stdall));
    }).pipe(catchError((error: Error) => of(failure(error))));
  }
}
