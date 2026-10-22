import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {defer, from, map, type Observable} from 'rxjs';
import type {PatkaText} from '../../patka-text/patka-text.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../relative-path/assert-relative-path-inside-the-working-directory.ts';

export type WriteFileInput = {
  readonly relativePath: string;
  readonly content: string;
};

export class WriteFile implements PatkaTool<WriteFileInput, string> {
  readonly name: string = 'write_file';
  readonly llmManual: PatkaToolLLMManual<WriteFileInput, string>;

  private readonly workingDirectory: string;

  constructor(workingDirectory: string, patkaText: PatkaText) {
    this.workingDirectory = workingDirectory;
    this.llmManual = patkaToolLLMManual<WriteFileInput, string>(
      this.name,
      objectJsonSchemaLLMManual<WriteFileInput>(
        this.name,
        patkaText.get('tool.write_file.description'),
        {
          relativePath: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.write_file.input.relativePath'),
          ),
          content: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.write_file.input.content'),
          ),
        },
      ),
      propertyJsonSchemaLLMManual('string', patkaText.get('tool.write_file.output')),
    );
  }

  invoke(writeFileInput: WriteFileInput): Observable<string> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(
        this.workingDirectory,
        writeFileInput.relativePath,
      );

      const path = join(this.workingDirectory, writeFileInput.relativePath);

      return from(
        mkdir(dirname(path), {recursive: true}).then(() =>
          writeFile(path, writeFileInput.content, 'utf8'),
        ),
      ).pipe(map(() => writeFileInput.relativePath));
    });
  }
}
