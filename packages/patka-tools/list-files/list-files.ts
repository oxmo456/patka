import {readdir} from 'node:fs/promises';
import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../patka-tool/patka-tool-relative-path.ts';
import {array} from '../../patka-tool-llm-manual/array.ts';
import {input} from '../../patka-tool-llm-manual/input.ts';
import {output} from '../../patka-tool-llm-manual/output.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {property} from '../../patka-tool-llm-manual/property.ts';
import {string} from '../../patka-tool-llm-manual/string.ts';
import {failure, success, type Try} from '../../try/try.ts';

export type ListFilesInput = {
  readonly relativePath: string;
};

export class ListFiles implements PatkaTool<ListFilesInput, ReadonlyArray<string>> {
  readonly llmManual: PatkaToolLLMManual = patkaToolLLMManual(
    'list_files',
    'Use it to discover what a directory holds before reading any file.',
    input(
      property(
        'relativePath',
        string(
          'Relative path of the directory to list, from the working directory (e.g. "." or "src/utils"). Never an absolute path and never outside the working directory: such a path is refused.',
        ),
      ),
    ),
    output(
      array(
        'The names of the files and directories found, directories ending with a slash.',
        string(),
      ),
    ),
  );

  invoke(listFilesInput: ListFilesInput): Observable<Try<Option<ReadonlyArray<string>>>> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(listFilesInput.relativePath);

      return from(readdir(listFilesInput.relativePath, {withFileTypes: true}));
    }).pipe(
      map((entries) =>
        success(
          some(
            entries.map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name)).sort(),
          ),
        ),
      ),
      catchError((error: Error) => of(failure(error))),
    );
  }
}
