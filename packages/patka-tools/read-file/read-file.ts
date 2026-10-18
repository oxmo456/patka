import {readFile} from 'node:fs/promises';
import {catchError, defer, from, map, type Observable, of} from 'rxjs';
import {type Option, some} from '../../option/option.ts';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {assertRelativePathInsideTheWorkingDirectory} from '../../patka-tool/patka-tool-relative-path.ts';
import {patkaToolInputLLMManual} from '../../patka-tool-llm-manual/patka-tool-input-llm-manual.ts';
import {patkaToolInputPropertyLLMManual} from '../../patka-tool-llm-manual/patka-tool-input-property-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolOutputLLMManual} from '../../patka-tool-llm-manual/patka-tool-output-llm-manual.ts';
import {failure, success, type Try} from '../../try/try.ts';

export type ReadFileInput = {
  readonly relativePath: string;
};

export class ReadFile implements PatkaTool<ReadFileInput, string> {
  readonly llmManual: PatkaToolLLMManual = patkaToolLLMManual(
    'read_file',
    'Use it once you know the path of the file you need to read.',
    patkaToolInputLLMManual(
      patkaToolInputPropertyLLMManual(
        'relativePath',
        'string',
        'Relative path of the file to read, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path and never outside the working directory: such a path is refused.',
      ),
    ),
    patkaToolOutputLLMManual('string', 'The whole contents of the file, as text.'),
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
