import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {defer, from, map, type Observable} from 'rxjs';
import type {PatkaText} from '../../patka-text/patka-text.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../relative-path/assert-relative-path-inside-the-working-directory.ts';

export type ListFilesInput = {
  readonly relativePath: string;
};

export class ListFiles implements PatkaTool<ListFilesInput, ReadonlyArray<string>> {
  readonly name: string = 'list_files';
  readonly llmManual: PatkaToolLLMManual<ListFilesInput, ReadonlyArray<string>>;

  private readonly workingDirectory: string;

  constructor(workingDirectory: string, patkaText: PatkaText) {
    this.workingDirectory = workingDirectory;
    this.llmManual = patkaToolLLMManual<ListFilesInput, ReadonlyArray<string>>(
      this.name,
      objectJsonSchemaLLMManual<ListFilesInput>(
        this.name,
        patkaText.get('tool.list_files.description'),
        {
          relativePath: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.list_files.input.relativePath'),
          ),
        },
      ),
      propertyJsonSchemaLLMManual('array', patkaText.get('tool.list_files.output')),
    );
  }

  invoke(listFilesInput: ListFilesInput): Observable<ReadonlyArray<string>> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(
        this.workingDirectory,
        listFilesInput.relativePath,
      );

      return from(
        readdir(join(this.workingDirectory, listFilesInput.relativePath), {withFileTypes: true}),
      );
    }).pipe(
      map((entries) =>
        entries.map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name)).sort(),
      ),
    );
  }
}
