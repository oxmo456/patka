import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {$} from 'zx';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../patka-tool/patka-tool-relative-path.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {failure, success, type Try} from '../../try/try.ts';

export type GrepFilesInput = {
  readonly pattern: string;
  readonly relativePath: string;
};

const MAXIMUM_MATCHES = 200;

function createMatchesFromStdout(stdout: string): string {
  const lines: ReadonlyArray<string> = stdout.split('\n').filter((line) => line !== '');

  if (lines.length <= MAXIMUM_MATCHES) {
    return stdout;
  }

  return [
    ...lines.slice(0, MAXIMUM_MATCHES),
    `${lines.length - MAXIMUM_MATCHES} more matches not shown. Use a narrower pattern or path.`,
    '',
  ].join('\n');
}

export class GrepFiles implements PatkaTool<GrepFilesInput, string> {
  readonly llmManual: PatkaToolLLMManual = patkaToolLLMManual(
    'grep_files',
    'Use it to find where a name or a text appears, before you read or change a file.',
    {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description:
            'The text to search, as a basic regular expression (e.g. "PatkaTool" or "class .*Files").',
        },
        relativePath: {
          type: 'string',
          description:
            'Relative path of the file or directory to search in, from the working directory (e.g. "./" for the whole working directory, or "src/utils"). Never an absolute path and never outside the working directory: such a path is refused.',
        },
      },
      required: ['pattern', 'relativePath'],
    },
    {
      type: 'string',
      description: `One line per match, as "path:line:text". Empty when no file matches. At most ${MAXIMUM_MATCHES} lines, then a last line tells how many matches are not shown.`,
    },
  );

  invoke(grepFilesInput: GrepFilesInput): Observable<Try<Option<string>>> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(grepFilesInput.relativePath);

      return from(
        Promise.resolve(
          $({
            cwd: process.cwd(),
            nothrow: true,
          })`git --literal-pathspecs -c color.ui=never grep --untracked -I -n -e ${grepFilesInput.pattern} -- ${grepFilesInput.relativePath}`,
        ),
      );
    }).pipe(
      map((processOutput) => {
        if (processOutput.exitCode === 0) {
          return success(some(createMatchesFromStdout(processOutput.stdout)));
        }

        if (processOutput.exitCode === 1) {
          return success(some(''));
        }

        return failure(new Error(`git grep failed: ${processOutput.stderr}`));
      }),
      catchError((error: Error) => of(failure(error))),
    );
  }
}
