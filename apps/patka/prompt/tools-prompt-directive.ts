import {createTextFromPatkaTextKey} from '../text/patka-text.ts';
import type {PatkaToolManual} from '../tools/patka-tool-manual.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';

function presentManual(patkaToolManual: PatkaToolManual): string {
  return createTextFromPatkaTextKey('prompt.tools.tool', {
    name: patkaToolManual.name,
    summary: patkaToolManual.summary,
    usage: patkaToolManual.usage,
    input: JSON.stringify(patkaToolManual.input),
    output: JSON.stringify(patkaToolManual.output),
  });
}

export class ToolsPromptDirective implements PatkaPromptDirective<PatkaPromptEnvironment> {
  readonly name = 'tools';
  readonly purpose = 'Let the model know which tools exist and how to invoke them.';
  readonly children: ReadonlyArray<PatkaPromptDirective<PatkaPromptEnvironment>> = [];

  render(patkaPromptEnvironment: PatkaPromptEnvironment): string {
    return patkaPromptEnvironment.patkaToolManuals.length === 0
      ? ''
      : [
          [
            createTextFromPatkaTextKey('prompt.tools.introduction'),
            ...patkaPromptEnvironment.patkaToolManuals.map(presentManual),
          ].join('\n'),
          [
            createTextFromPatkaTextKey('prompt.tools.protocol.singleLine'),
            createTextFromPatkaTextKey('prompt.tools.protocol.format'),
            createTextFromPatkaTextKey('prompt.tools.protocol.example'),
            createTextFromPatkaTextKey('prompt.tools.protocol.inputSchema'),
            createTextFromPatkaTextKey('prompt.tools.protocol.neverGuess'),
            createTextFromPatkaTextKey('prompt.tools.protocol.askWhenUnclear'),
          ].join('\n'),
        ].join('\n\n');
  }
}
