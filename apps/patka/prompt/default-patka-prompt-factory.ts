import {match} from 'ts-pattern';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import {createJsonFromToolTry} from '../tools/patka-tool-json.ts';
import type {PatkaTools} from '../tools/patka-tools.ts';
import {DefaultPatkaPromptDirective} from './default-patka-prompt-directive.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';
import type {PatkaPromptFactory} from './patka-prompt-factory.ts';
import {createMarkdownFromPatkaPromptDirective} from './patka-prompt-markdown.ts';
import {ToolsPromptDirective} from './tools-prompt-directive.ts';
import {WorkingDirectoryPromptDirective} from './working-directory-prompt-directive.ts';

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
  private readonly patkaPromptDirective: PatkaPromptDirective<PatkaPromptEnvironment> =
    new DefaultPatkaPromptDirective(
      'patka',
      'Make the model a useful coding agent for the user.',
      '',
      [
        new DefaultPatkaPromptDirective('role', 'Give the model an identity and a goal.', 'Role', [
          new DefaultPatkaPromptDirective(
            'identity',
            'Make the model act as Patka, on behalf of the user.',
            'You are Patka, an agent that helps the human user with their tasks.',
          ),
        ]),
        new DefaultPatkaPromptDirective(
          'actions',
          'Make the model act, not only talk.',
          'Actions',
          [
            new DefaultPatkaPromptDirective(
              'act-with-tools',
              'Let the model know that tools are its only way to act.',
              "You act by calling tools: code that runs on the user's machine and returns a result.",
            ),
            new DefaultPatkaPromptDirective(
              'use-tools-for-actions',
              'Make the model use a tool when the user asks for an action.',
              'If the user asks you to do something or perform an action, you will most likely need to use one of the tools provided below.',
            ),
            new DefaultPatkaPromptDirective(
              'answer-directly',
              'Stop the model from calling a tool it does not need.',
              'If no tool is necessary, answer the user directly.',
            ),
          ],
        ),
        new DefaultPatkaPromptDirective(
          'answer-style',
          'Long answers waste the attention of the user.',
          'Answer style',
          [
            new DefaultPatkaPromptDirective(
              'answer-briefly',
              'Keep each answer short.',
              'Use the fewest words possible.',
            ),
            new DefaultPatkaPromptDirective(
              'no-filler',
              'Remove the words that carry no information.',
              'No preamble, no restatement of the question, no closing offer to help.',
            ),
            new DefaultPatkaPromptDirective(
              'markdown',
              'Let the chat render the answer.',
              'Write the answer in markdown.',
            ),
          ],
        ),
        new DefaultPatkaPromptDirective(
          'environment',
          'Let the model know where it acts.',
          'Environment',
          [new WorkingDirectoryPromptDirective()],
        ),
        new DefaultPatkaPromptDirective(
          'tools-section',
          'Group what the model needs to act with tools.',
          'Tools',
          [new ToolsPromptDirective()],
        ),
      ],
    );

  constructor(patkaTools: PatkaTools, workingDirectory: string) {
    this.patkaTools = patkaTools;
    this.workingDirectory = workingDirectory;
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
