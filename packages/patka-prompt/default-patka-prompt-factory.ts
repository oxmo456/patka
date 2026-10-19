import type {PatkaContextEntry} from '../patka-context/patka-context-entry.ts';
import type {PatkaTools} from '../patka-tool/patka-tools.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';
import type {PatkaPromptFactory} from './patka-prompt-factory.ts';
import {createMarkdownFromPatkaPromptDirective} from './patka-prompt-markdown.ts';

export class DefaultPatkaPromptFactory implements PatkaPromptFactory {
  private readonly patkaTools: PatkaTools;
  private readonly workingDirectory: string;
  private readonly patkaPromptDirective: PatkaPromptDirective<PatkaPromptEnvironment>;

  constructor(
    patkaTools: PatkaTools,
    workingDirectory: string,
    patkaPromptDirective: PatkaPromptDirective<PatkaPromptEnvironment>,
  ) {
    this.patkaTools = patkaTools;
    this.workingDirectory = workingDirectory;
    this.patkaPromptDirective = patkaPromptDirective;
  }

  create(patkaContextEntries: ReadonlyArray<PatkaContextEntry>): string {
    const patkaPromptEnvironment: PatkaPromptEnvironment = {
      workingDirectory: this.workingDirectory,
      patkaTools: this.patkaTools.list(),
      patkaContextEntries,
    };

    return createMarkdownFromPatkaPromptDirective(
      this.patkaPromptDirective,
      patkaPromptEnvironment,
    );
  }
}
