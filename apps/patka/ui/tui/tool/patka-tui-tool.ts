import {defer, EMPTY, type Observable} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import type {PatkaTool} from '../../../../../packages/patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../../../../packages/patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../../../../packages/patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../../../../packages/patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../../../../packages/patka-tool-llm-manual/property-json-schema-llm-manual.ts';
import {PATKA_UI} from '../../patka-ui.token.ts';
import type {PatkaUI} from '../../patka-ui.ts';

export type PatkaTUIToolInput = {
  readonly command: 'show_logs' | 'hide_logs';
};

@injectable()
export class PatkaTUITool implements PatkaTool<PatkaTUIToolInput, string> {
  readonly name: string = 'patka_tui';
  readonly llmManual: PatkaToolLLMManual<PatkaTUIToolInput, string> = patkaToolLLMManual<
    PatkaTUIToolInput,
    string
  >(
    this.name,
    objectJsonSchemaLLMManual<PatkaTUIToolInput>(
      this.name,
      'Use it to change the patka terminal UI when the user asks for it.',
      {
        command: propertyJsonSchemaLLMManual(
          'string',
          'One of: "show_logs" to show the log panel, "hide_logs" to hide the log panel.',
        ),
      },
    ),
    propertyJsonSchemaLLMManual('string', 'It has no output.'),
  );
  private readonly patkaUI: PatkaUI;

  constructor(@inject(PATKA_UI) patkaUI: PatkaUI) {
    this.patkaUI = patkaUI;
  }

  invoke(patkaTUIToolInput: PatkaTUIToolInput): Observable<string> {
    return defer(() =>
      match(patkaTUIToolInput.command)
        .with('show_logs', (): Observable<string> => {
          this.patkaUI.showLogs();
          return EMPTY;
        })
        .with('hide_logs', (): Observable<string> => {
          this.patkaUI.hideLogs();
          return EMPTY;
        })
        .otherwise((command): Observable<string> => {
          throw new Error(`Unknown command: ${command}`);
        }),
    );
  }
}
