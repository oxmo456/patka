import {createTextFromPatkaTextKey} from '../text/patka-text.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';

export class WorkingDirectoryPromptDirective
  implements PatkaPromptDirective<PatkaPromptEnvironment>
{
  readonly name = 'working-directory';
  readonly purpose = 'Let the model resolve relative paths.';
  readonly children: ReadonlyArray<PatkaPromptDirective<PatkaPromptEnvironment>> = [];

  render(patkaPromptEnvironment: PatkaPromptEnvironment): string {
    return createTextFromPatkaTextKey('prompt.environment.workingDirectory', {
      workingDirectory: patkaPromptEnvironment.workingDirectory,
    });
  }
}
