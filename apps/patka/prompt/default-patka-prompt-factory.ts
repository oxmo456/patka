import {match} from 'ts-pattern';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import {createJsonFromToolTry} from '../tools/patka-tool-json.ts';
import type {PatkaTools} from '../tools/patka-tools.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';
import type {PatkaPromptFactory} from './patka-prompt-factory.ts';
import {createMarkdownFromPatkaPromptDirective} from './patka-prompt-markdown.ts';

const USER = 'User';

const ASSISTANT = 'Assistant';

const PATKA = 'Patka';

function present(patkaContextEntry: PatkaContextEntry): ReadonlyArray<string> {
  return match(patkaContextEntry)
    .with({type: 'PatkaUserUtterance'}, ({utterance}) => [`${USER}: ${utterance.content}`])
    .with({type: 'PatkaInferenceClientResponse'}, ({content}) => [`${ASSISTANT}: ${content}`])
    .with({type: 'PatkaToolCall'}, () => [])
    .with({type: 'PatkaAgentUtterance'}, ({content}) => [`${PATKA}: ${content}`])
    .with({type: 'PatkaUserNotification'}, () => [])
    .with({type: 'PatkaError'}, () => [])
    .with({type: 'PatkaToolOutput'}, ({output}) => [
      `Tool output: ${JSON.stringify(createJsonFromToolTry(output))}`,
    ])
    .exhaustive();
}

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

  private header(): string {
    const patkaPromptEnvironment: PatkaPromptEnvironment = {
      workingDirectory: this.workingDirectory,
      patkaToolManuals: this.patkaTools.manuals(),
    };

    return createMarkdownFromPatkaPromptDirective(
      this.patkaPromptDirective,
      patkaPromptEnvironment,
    );
  }

  create(patkaContextEntries: ReadonlyArray<PatkaContextEntry>): string {
    const spoken = patkaContextEntries.flatMap(present);

    return [this.header(), '', ...spoken, `${ASSISTANT}:`].join('\n');
  }
}
