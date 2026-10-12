import type {PatkaToolManual} from '../tools/patka-tool-manual.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';

function presentManual(patkaToolManual: PatkaToolManual): string {
  return [
    `- ${patkaToolManual.name}: ${patkaToolManual.summary}`,
    `  usage: ${patkaToolManual.usage}`,
    `  input: ${JSON.stringify(patkaToolManual.input)}`,
    `  output: ${JSON.stringify(patkaToolManual.output)}`,
  ].join('\n');
}

export class ToolsPromptDirective implements PatkaPromptDirective<PatkaPromptEnvironment> {
  readonly name = 'tools';
  readonly purpose = 'Let the model know which tools exist and how to invoke them.';
  readonly children: ReadonlyArray<PatkaPromptDirective<PatkaPromptEnvironment>> = [];
  private readonly patkaToolProtocol = new PatkaToolProtocol();

  render(patkaPromptEnvironment: PatkaPromptEnvironment): string {
    return patkaPromptEnvironment.patkaToolManuals.length === 0
      ? ''
      : [
          [
            'You can use these tools:',
            ...patkaPromptEnvironment.patkaToolManuals.map(presentManual),
          ].join('\n'),
          this.patkaToolProtocol.manual,
        ].join('\n\n');
  }
}
