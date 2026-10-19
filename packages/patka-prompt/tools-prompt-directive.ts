import type {JsonObject, JsonValue} from '../json/json.ts';
import type {PatkaTool} from '../patka-tool/patka-tool.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';

export type ToolsPromptText = {
  readonly introduction: string;
  readonly tool: (patkaTool: PatkaTool<JsonObject, JsonValue>) => string;
  readonly protocol: ReadonlyArray<string>;
};

export class ToolsPromptDirective implements PatkaPromptDirective<PatkaPromptEnvironment> {
  readonly name = 'tools';
  readonly purpose = 'Let the model know which tools exist and how to invoke them.';
  readonly children: ReadonlyArray<PatkaPromptDirective<PatkaPromptEnvironment>> = [];
  private readonly toolsPromptText: ToolsPromptText;

  constructor(toolsPromptText: ToolsPromptText) {
    this.toolsPromptText = toolsPromptText;
  }

  render(patkaPromptEnvironment: PatkaPromptEnvironment): string {
    return patkaPromptEnvironment.patkaTools.length === 0
      ? ''
      : [
          [
            this.toolsPromptText.introduction,
            ...patkaPromptEnvironment.patkaTools.map(this.toolsPromptText.tool),
          ].join('\n'),
          this.toolsPromptText.protocol.join('\n'),
        ].join('\n\n');
  }
}
