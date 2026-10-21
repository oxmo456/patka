import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {defer, from, type Observable} from 'rxjs';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../relative-path/assert-relative-path-inside-the-working-directory.ts';

export type ReadFileInput = {
  readonly relativePath: string;
};

export class ReadFile implements PatkaTool<ReadFileInput, string> {
  readonly name: string = 'read_file';
  readonly llmManual: PatkaToolLLMManual<ReadFileInput, string> = patkaToolLLMManual<
    ReadFileInput,
    string
  >(
    this.name,
    objectJsonSchemaLLMManual<ReadFileInput>(
      this.name,
      'Use it once you know the path of the file you need to read.',
      {
        relativePath: propertyJsonSchemaLLMManual(
          'string',
          'Relative path of the file to read, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path and never outside the working directory: such a path is refused.',
        ),
      },
    ),
    propertyJsonSchemaLLMManual('string', 'The whole contents of the file, as text.'),
  );

  private readonly workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  invoke(readFileInput: ReadFileInput): Observable<string> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(
        this.workingDirectory,
        readFileInput.relativePath,
      );

      return from(readFile(join(this.workingDirectory, readFileInput.relativePath), 'utf8'));
    });
  }
}
