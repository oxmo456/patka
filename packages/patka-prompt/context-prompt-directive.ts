import {match} from 'ts-pattern';
import type {PatkaContextEntry} from '../patka-agent/context/patka-context-entry.ts';
import {createJsonFromToolTry} from '../patka-agent/tools/patka-tool-json.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';

export type ContextPromptText = {
  readonly userUtterance: (content: string) => string;
  readonly inferenceClientResponse: (content: string) => string;
  readonly agentUtterance: (content: string) => string;
  readonly toolOutput: (output: string) => string;
};

export class ContextPromptDirective implements PatkaPromptDirective<PatkaPromptEnvironment> {
  readonly name = 'context';
  readonly purpose = 'Give the model the conversation so far.';
  readonly children: ReadonlyArray<PatkaPromptDirective<PatkaPromptEnvironment>> = [];
  private readonly contextPromptText: ContextPromptText;

  constructor(contextPromptText: ContextPromptText) {
    this.contextPromptText = contextPromptText;
  }

  render(patkaPromptEnvironment: PatkaPromptEnvironment): string {
    return patkaPromptEnvironment.patkaContextEntries
      .flatMap((patkaContextEntry: PatkaContextEntry) => this.present(patkaContextEntry))
      .join('\n');
  }

  private present(patkaContextEntry: PatkaContextEntry): ReadonlyArray<string> {
    return match(patkaContextEntry)
      .with({type: 'PatkaUserUtterance'}, ({utterance}) => [
        this.contextPromptText.userUtterance(utterance.content),
      ])
      .with({type: 'PatkaInferenceClientResponse'}, ({content}) => [
        this.contextPromptText.inferenceClientResponse(content),
      ])
      .with({type: 'PatkaToolCall'}, () => [])
      .with({type: 'PatkaAgentUtterance'}, ({content}) => [
        this.contextPromptText.agentUtterance(content),
      ])
      .with({type: 'PatkaUserNotification'}, () => [])
      .with({type: 'PatkaError'}, () => [])
      .with({type: 'PatkaToolOutput'}, ({output}) => [
        this.contextPromptText.toolOutput(JSON.stringify(createJsonFromToolTry(output))),
      ])
      .exhaustive();
  }
}
