import {defer, from, map, type Observable} from 'rxjs';
import {$} from 'zx';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../relative-path/assert-relative-path-inside-the-working-directory.ts';

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
  readonly name: string = 'grep_files';
  readonly llmManual: PatkaToolLLMManual<GrepFilesInput, string> = patkaToolLLMManual<
    GrepFilesInput,
    string
  >(
    this.name,
    objectJsonSchemaLLMManual<GrepFilesInput>(
      this.name,
      'Use it to find where a name or a text appears, before you read or change a file.',
      {
        pattern: propertyJsonSchemaLLMManual(
          'string',
          'The text to search, as a basic regular expression (e.g. "PatkaTool" or "class .*Files").',
        ),
        relativePath: propertyJsonSchemaLLMManual(
          'string',
          'Relative path of the file or directory to search in, from the working directory (e.g. "./" for the whole working directory, or "src/utils"). Never an absolute path and never outside the working directory: such a path is refused.',
        ),
      },
    ),
    propertyJsonSchemaLLMManual(
      'string',
      `One line per match, as "path:line:text". Empty when no file matches. At most ${MAXIMUM_MATCHES} lines, then a last line tells how many matches are not shown.`,
    ),
  );

  invoke(grepFilesInput: GrepFilesInput): Observable<string> {
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
          return createMatchesFromStdout(processOutput.stdout);
        }

        if (processOutput.exitCode === 1) {
          return '';
        }

        throw new Error(`git grep failed: ${processOutput.stderr}`);
      }),
    );
  }
}
