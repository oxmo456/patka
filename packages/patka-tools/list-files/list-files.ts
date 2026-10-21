import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {defer, from, map, type Observable} from 'rxjs';
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
  readonly llmManual: PatkaToolLLMManual<ListFilesInput, ReadonlyArray<string>> =
    patkaToolLLMManual<ListFilesInput, ReadonlyArray<string>>(
      this.name,
      objectJsonSchemaLLMManual<ListFilesInput>(
        this.name,
        'Use it to discover what a directory holds before reading any file.',
        {
          relativePath: propertyJsonSchemaLLMManual(
            'string',
            'Relative path of the directory to list, from the working directory (e.g. "." or "src/utils"). Never an absolute path and never outside the working directory: such a path is refused.',
          ),
        },
      ),
      propertyJsonSchemaLLMManual(
        'array',
        'The names of the files and directories found, directories ending with a slash.',
      ),
    );

  private readonly workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
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
