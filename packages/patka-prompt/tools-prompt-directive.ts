import type {PatkaToolLLMManual} from '../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';

export type ToolsPromptText = {
  readonly introduction: string;
  readonly tool: (patkaToolLLMManual: PatkaToolLLMManual) => string;
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
    return patkaPromptEnvironment.patkaToolLLMManuals.length === 0
      ? ''
      : [
          [
            this.toolsPromptText.introduction,
            ...patkaPromptEnvironment.patkaToolLLMManuals.map(this.toolsPromptText.tool),
          ].join('\n'),
          this.toolsPromptText.protocol.join('\n'),
        ].join('\n\n');
  }
}
