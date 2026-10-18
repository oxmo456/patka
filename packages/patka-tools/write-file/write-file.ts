import {writeFile} from 'node:fs/promises';
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

export type WriteFileInput = {
  readonly relativePath: string;
  readonly content: string;
};

export class WriteFile implements PatkaTool<WriteFileInput, string> {
  readonly llmManual: PatkaToolLLMManual = patkaToolLLMManual(
    'write_file',
    'Use it once you know the path of the file and the whole text it must hold.',
    patkaToolInputLLMManual(
      patkaToolInputPropertyLLMManual(
        'relativePath',
        'string',
        'Relative path of the file to write, from the working directory (e.g. "notes.txt" or "src/main.ts"). Never an absolute path and never outside the working directory: such a path is refused.',
      ),
      patkaToolInputPropertyLLMManual('content', 'string', 'The whole text the file must hold.'),
    ),
    patkaToolOutputLLMManual('string', 'The path of the file that was written.'),
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
