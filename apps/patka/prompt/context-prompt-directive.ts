import {match} from 'ts-pattern';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import {createTextFromPatkaTextKey} from '../text/patka-text.ts';
import {createJsonFromToolTry} from '../tools/patka-tool-json.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';

function present(patkaContextEntry: PatkaContextEntry): ReadonlyArray<string> {
  return match(patkaContextEntry)
    .with({type: 'PatkaUserUtterance'}, ({utterance}) => [
      createTextFromPatkaTextKey('prompt.conversation.userUtterance', {
        content: utterance.content,
      }),
    ])
    .with({type: 'PatkaInferenceClientResponse'}, ({content}) => [
      createTextFromPatkaTextKey('prompt.conversation.inferenceClientResponse', {content}),
    ])
    .with({type: 'PatkaToolCall'}, () => [])
    .with({type: 'PatkaAgentUtterance'}, ({content}) => [
      createTextFromPatkaTextKey('prompt.conversation.agentUtterance', {content}),
    ])
    .with({type: 'PatkaUserNotification'}, () => [])
    .with({type: 'PatkaError'}, () => [])
    .with({type: 'PatkaToolOutput'}, ({output}) => [
      createTextFromPatkaTextKey('prompt.conversation.toolOutput', {
        output: JSON.stringify(createJsonFromToolTry(output)),
      }),
    ])
    .exhaustive();
}

export class ContextPromptDirective implements PatkaPromptDirective<PatkaPromptEnvironment> {
  readonly name = 'context';
  readonly purpose = 'Give the model the conversation so far.';
  readonly children: ReadonlyArray<PatkaPromptDirective<PatkaPromptEnvironment>> = [];

  render(patkaPromptEnvironment: PatkaPromptEnvironment): string {
    return patkaPromptEnvironment.patkaContextEntries.flatMap(present).join('\n');
  }
}
