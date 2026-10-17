import {writeFile} from 'node:fs/promises';
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
} from '../../patka-agent/tools/patka-tool-manual-dsl.ts';
import {failure, success, type Try} from '../../try/try.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../patka-tool-relative-path.ts';

export type WriteFileInput = {
  readonly relativePath: string;
  readonly content: string;
};

export class WriteFile implements PatkaTool<WriteFileInput, string> {
  readonly manual: PatkaToolManual = patkaToolManual(
    'write_file',
    'Writes text to a file, replacing what the file held.',
    'Use it once you know the path of the file and the whole text it must hold.',
    input(
      property(
        'relativePath',
        string(
          'Relative path of the file to write, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path and never outside the working directory: such a path is refused.',
        ),
      ),
      property('content', string('The whole text the file must hold.')),
    ),
    output(string('The path of the file that was written.')),
  );

  invoke(writeFileInput: WriteFileInput): Observable<Try<Option<string>>> {
    return defer(() => {
      assertRelativePathInsideTheWorkingDirectory(writeFileInput.relativePath);

      return from(writeFile(writeFileInput.relativePath, writeFileInput.content, 'utf8')).pipe(
        map(() => success(some(writeFileInput.relativePath))),
      );
    }).pipe(catchError((error: Error) => of(failure(error))));
  }
}
