import {readdir} from 'node:fs/promises';
import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import type {PatkaToolManual} from '../../patka-tool/patka-tool-manual.ts';
import {
  array,
  input,
  output,
  patkaToolManual,
  property,
  string,
} from '../../patka-tool/patka-tool-manual.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../patka-tool/patka-tool-relative-path.ts';
import {failure, success, type Try} from '../../try/try.ts';

export type ListFilesInput = {
  readonly relativePath: string;
};

export class ListFiles implements PatkaTool<ListFilesInput, ReadonlyArray<string>> {
  readonly manual: PatkaToolManual = patkaToolManual(
    'list_files',
    'Lists the files and directories directly under a path.',
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
