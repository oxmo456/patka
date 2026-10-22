import {defer, from, type Observable} from 'rxjs';
import {$} from 'zx';
import type {PatkaText} from '../../patka-text/patka-text.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../relative-path/assert-relative-path-inside-the-working-directory.ts';

export type GitDiffInput = {
  readonly relativePath: string;
};

export class GitDiff implements PatkaTool<GitDiffInput, string> {
  readonly name: string = 'git_diff';
  readonly llmManual: PatkaToolLLMManual<GitDiffInput, string>;

  private readonly workingDirectory: string;

  constructor(workingDirectory: string, patkaText: PatkaText) {
    this.workingDirectory = workingDirectory;
    this.llmManual = patkaToolLLMManual<GitDiffInput, string>(
      this.name,
      objectJsonSchemaLLMManual<GitDiffInput>(
        this.name,
        patkaText.get('tool.git_diff.description'),
        {
          relativePath: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.git_diff.input.relativePath'),
          ),
        },
      ),
      propertyJsonSchemaLLMManual('string', patkaText.get('tool.git_diff.output')),
    );
  }

  invoke(gitDiffInput: GitDiffInput): Observable<string> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(this.workingDirectory, gitDiffInput.relativePath);

      return from(
        $({
          cwd: this.workingDirectory,
        })`git -c color.ui=never diff -- ${gitDiffInput.relativePath}`.text(),
      );
    });
  }
}
