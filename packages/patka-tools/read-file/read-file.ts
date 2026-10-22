import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {defer, from, type Observable} from 'rxjs';
import type {PatkaText} from '../../patka-text/patka-text.ts';
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
  readonly llmManual: PatkaToolLLMManual<ReadFileInput, string>;

  private readonly workingDirectory: string;

  constructor(workingDirectory: string, patkaText: PatkaText) {
    this.workingDirectory = workingDirectory;
    this.llmManual = patkaToolLLMManual<ReadFileInput, string>(
      this.name,
      objectJsonSchemaLLMManual<ReadFileInput>(
        this.name,
        patkaText.get('tool.read_file.description'),
        {
          relativePath: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.read_file.input.relativePath'),
          ),
        },
      ),
      propertyJsonSchemaLLMManual('string', patkaText.get('tool.read_file.output')),
    );
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
