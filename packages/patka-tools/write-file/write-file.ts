import {writeFile} from 'node:fs/promises';
import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../patka-tool/patka-tool-relative-path.ts';
import {input} from '../../patka-tool-llm-manual/input.ts';
import {output} from '../../patka-tool-llm-manual/output.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {property} from '../../patka-tool-llm-manual/property.ts';
import {string} from '../../patka-tool-llm-manual/string.ts';
import {failure, success, type Try} from '../../try/try.ts';

export type WriteFileInput = {
  readonly relativePath: string;
  readonly content: string;
};

export class WriteFile implements PatkaTool<WriteFileInput, string> {
  readonly llmManual: PatkaToolLLMManual = patkaToolLLMManual(
    'write_file',
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
