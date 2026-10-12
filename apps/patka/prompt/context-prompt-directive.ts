import {match} from 'ts-pattern';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import {createJsonFromToolTry} from '../tools/patka-tool-json.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';

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

export class ContextPromptDirective implements PatkaPromptDirective<PatkaPromptEnvironment> {
  readonly name = 'context';
  readonly purpose = 'Give the model the conversation so far, and leave it the last cue to answer.';
  readonly children: ReadonlyArray<PatkaPromptDirective<PatkaPromptEnvironment>> = [];

  render(patkaPromptEnvironment: PatkaPromptEnvironment): string {
    return [...patkaPromptEnvironment.patkaContextEntries.flatMap(present), `${ASSISTANT}:`].join(
      '\n',
    );
  }
}
