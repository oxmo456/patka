import {readFile} from 'node:fs/promises';
import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-agent/tools/patka-tool.ts';
import type {PatkaToolManual} from '../../patka-agent/tools/patka-tool-manual.ts';
import {
  input,
  output,
  patkaToolManual,
  property,
  string,
} from '../../patka-agent/tools/patka-tool-manual.ts';
import {failure, success, type Try} from '../../try/try.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../patka-tool-relative-path.ts';

export type ReadFileInput = {
  readonly relativePath: string;
};

export class ReadFile implements PatkaTool<ReadFileInput, string> {
  readonly manual: PatkaToolManual = patkaToolManual(
    'read_file',
    'Reads the whole contents of a file.',
    'Use it once you know the path of the file you need to read.',
    input(
      property(
        'relativePath',
        string(
          'Relative path of the file to read, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path and never outside the working directory: such a path is refused.',
        ),
      ),
    ),
    output(string('The whole contents of the file, as text.')),
  );

  invoke(readFileInput: ReadFileInput): Observable<Try<Option<string>>> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(readFileInput.relativePath);

      return from(readFile(readFileInput.relativePath, 'utf8')).pipe(
        map((value) => success(some(value))),
      );
    }).pipe(catchError((error: Error) => of(failure(error))));
  }
}
