import {defer, from, type Observable} from 'rxjs';
import {$} from 'zx';
import type {PatkaTool} from '../../patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../patka-tool-llm-manual/property-json-schema-llm-manual.ts';

export class GitStatus implements PatkaTool<Record<string, never>, string> {
  readonly name: string = 'git_status';
  readonly llmManual: PatkaToolLLMManual<Record<string, never>, string> = patkaToolLLMManual<
    Record<string, never>,
    string
  >(
    this.name,
    objectJsonSchemaLLMManual<Record<string, never>>(
      this.name,
      'Use it to know which files are changed, staged or not tracked by git.',
      {},
    ),
    propertyJsonSchemaLLMManual('string', 'The text that "git status" prints.'),
  );

  private readonly workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  invoke(): Observable<string> {
    return defer(() => from($({cwd: this.workingDirectory})`git -c color.ui=never status`.text()));
  }
}
