import {inject, injectable} from 'tsyringe';
import type {PatkaContextEntry} from '../../../packages/patka-agent/context/patka-context-entry.ts';
import type {PatkaPromptFactory} from '../../../packages/patka-agent/prompt/patka-prompt-factory.ts';
import {PatkaTools} from '../../../packages/patka-agent/tools/patka-tools.ts';
import {WORKING_DIRECTORY} from '../../../packages/working-directory/working-directory.token.ts';
import {PATKA_PROMPT_DIRECTIVE} from './patka-prompt-directive.token.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';
import {createMarkdownFromPatkaPromptDirective} from './patka-prompt-markdown.ts';

@injectable()
export class DefaultPatkaPromptFactory implements PatkaPromptFactory {
  private readonly patkaTools: PatkaTools;
  private readonly workingDirectory: string;
  private readonly patkaPromptDirective: PatkaPromptDirective<PatkaPromptEnvironment>;

  constructor(
    @inject(PatkaTools) patkaTools: PatkaTools,
    @inject(WORKING_DIRECTORY) workingDirectory: string,
    @inject(PATKA_PROMPT_DIRECTIVE)
    patkaPromptDirective: PatkaPromptDirective<PatkaPromptEnvironment>,
  ) {
    this.patkaTools = patkaTools;
    this.workingDirectory = workingDirectory;
    this.patkaPromptDirective = patkaPromptDirective;
  }

  create(patkaContextEntries: ReadonlyArray<PatkaContextEntry>): string {
    const patkaPromptEnvironment: PatkaPromptEnvironment = {
      workingDirectory: this.workingDirectory,
      patkaToolManuals: this.patkaTools.manuals(),
      patkaContextEntries,
    };

    return createMarkdownFromPatkaPromptDirective(
      this.patkaPromptDirective,
      patkaPromptEnvironment,
    );
  }
}
