import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';

export type WorkingDirectoryPromptText = (workingDirectory: string) => string;

export class WorkingDirectoryPromptDirective
  implements PatkaPromptDirective<PatkaPromptEnvironment>
{
  readonly name = 'working-directory';
  readonly purpose = 'Let the model resolve relative paths.';
  readonly children: ReadonlyArray<PatkaPromptDirective<PatkaPromptEnvironment>> = [];
  private readonly workingDirectoryPromptText: WorkingDirectoryPromptText;

  constructor(workingDirectoryPromptText: WorkingDirectoryPromptText) {
    this.workingDirectoryPromptText = workingDirectoryPromptText;
  }

  render(patkaPromptEnvironment: PatkaPromptEnvironment): string {
    return this.workingDirectoryPromptText(patkaPromptEnvironment.workingDirectory);
  }
}
