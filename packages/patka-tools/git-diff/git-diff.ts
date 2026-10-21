import {defer, from, type Observable} from 'rxjs';
import {$} from 'zx';
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
  readonly llmManual: PatkaToolLLMManual<GitDiffInput, string> = patkaToolLLMManual<
    GitDiffInput,
    string
  >(
    this.name,
    objectJsonSchemaLLMManual<GitDiffInput>(
      this.name,
      'Use it to see what changed in a file that git status shows as modified.',
      {
        relativePath: propertyJsonSchemaLLMManual(
          'string',
          'Relative path of the file to diff, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path and never outside the working directory: such a path is refused.',
        ),
      },
    ),
    propertyJsonSchemaLLMManual(
      'string',
      'The text that "git diff" prints for the file. Empty when the file has no change.',
    ),
  );

  invoke(gitDiffInput: GitDiffInput): Observable<string> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(gitDiffInput.relativePath);

      return from($`git -c color.ui=never diff -- ${gitDiffInput.relativePath}`.text());
    });
  }
}
