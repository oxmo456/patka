import {defer, EMPTY, type Observable} from 'rxjs';
import {match} from 'ts-pattern';
import {inject, injectable} from 'tsyringe';
import {PatkaText} from '../../../../../packages/patka-text/patka-text.ts';
import type {PatkaTool} from '../../../../../packages/patka-tool/patka-tool.ts';
import {objectJsonSchemaLLMManual} from '../../../../../packages/patka-tool-llm-manual/object-json-schema-llm-manual.ts';
import type {PatkaToolLLMManual} from '../../../../../packages/patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {patkaToolLLMManual} from '../../../../../packages/patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {propertyJsonSchemaLLMManual} from '../../../../../packages/patka-tool-llm-manual/property-json-schema-llm-manual.ts';
import {PATKA_UI} from '../../patka-ui.token.ts';
import type {PatkaUI} from '../../patka-ui.ts';

export type PatkaTUIToolInput = {
  readonly command:
    | 'show_logs'
    | 'hide_logs'
    | 'show_inference_client_chat'
    | 'hide_inference_client_chat';
};

@injectable()
export class PatkaTUITool implements PatkaTool<PatkaTUIToolInput, string> {
  readonly name: string = 'patka_tui';
  readonly llmManual: PatkaToolLLMManual<PatkaTUIToolInput, string>;
  private readonly patkaUI: PatkaUI;

  constructor(@inject(PATKA_UI) patkaUI: PatkaUI, @inject(PatkaText) patkaText: PatkaText) {
    this.patkaUI = patkaUI;
    this.llmManual = patkaToolLLMManual<PatkaTUIToolInput, string>(
      this.name,
      objectJsonSchemaLLMManual<PatkaTUIToolInput>(
        this.name,
        patkaText.get('tool.patka_tui.description'),
        {
          command: propertyJsonSchemaLLMManual(
            'string',
            patkaText.get('tool.patka_tui.input.command'),
          ),
        },
      ),
      propertyJsonSchemaLLMManual('string', patkaText.get('tool.patka_tui.output')),
    );
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
        .with('show_inference_client_chat', (): Observable<string> => {
          this.patkaUI.showInferenceClientChat();
          return EMPTY;
        })
        .with('hide_inference_client_chat', (): Observable<string> => {
          this.patkaUI.hideInferenceClientChat();
          return EMPTY;
        })
        .otherwise((command): Observable<string> => {
          throw new Error(`Unknown command: ${command}`);
        }),
    );
  }
}
