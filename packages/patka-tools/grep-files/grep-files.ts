import {defer, from, map, type Observable} from 'rxjs';
import {$} from 'zx';
import type {PatkaText} from '../../patka-text/patka-text.ts';
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
  readonly llmManual: PatkaToolLLMManual<GrepFilesInput, string>;

  private readonly workingDirectory: string;

  constructor(workingDirectory: string, patkaText: PatkaText) {
    this.workingDirectory = workingDirectory;
    this.llmManual = patkaToolLLMManual<GrepFilesInput, string>(
      this.name,
      objectJsonSchemaLLMManual<GrepFilesInput>(
        this.name,
        patkaText.get('tool.grep_files.description'),
        {
          pattern: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.grep_files.input.pattern'),
          ),
          relativePath: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.grep_files.input.relativePath'),
          ),
        },
      ),
      propertyJsonSchemaLLMManual(
        'string',
        patkaText.get('tool.grep_files.output', {
          maximumMatches: String(MAXIMUM_MATCHES),
        }),
      ),
    );
  }

  invoke(grepFilesInput: GrepFilesInput): Observable<string> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(
        this.workingDirectory,
        grepFilesInput.relativePath,
      );

      return from(
        Promise.resolve(
          $({
            cwd: this.workingDirectory,
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
