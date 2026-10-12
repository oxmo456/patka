import {createTextFromPatkaTextKey} from '../text/patka-text.ts';
import {ContextPromptDirective} from './context-prompt-directive.ts';
import {DefaultPatkaPromptDirective} from './default-patka-prompt-directive.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';
import {ToolsPromptDirective} from './tools-prompt-directive.ts';
import {WorkingDirectoryPromptDirective} from './working-directory-prompt-directive.ts';

export function createPatkaPromptDirective(): PatkaPromptDirective<PatkaPromptEnvironment> {
  return new DefaultPatkaPromptDirective<PatkaPromptEnvironment>(
    'patka',
    'Make the model a useful coding agent for the user.',
    '',
    [
      new DefaultPatkaPromptDirective(
        'role',
        'Give the model an identity and a goal.',
        createTextFromPatkaTextKey('prompt.role'),
        [
          new DefaultPatkaPromptDirective(
            'identity',
            'Make the model act as Patka, on behalf of the user.',
            createTextFromPatkaTextKey('prompt.role.identity'),
          ),
        ],
      ),
      new DefaultPatkaPromptDirective(
        'actions',
        'Make the model act, not only talk.',
        createTextFromPatkaTextKey('prompt.actions'),
        [
          new DefaultPatkaPromptDirective(
            'act-with-tools',
            'Let the model know that tools are its only way to act.',
            createTextFromPatkaTextKey('prompt.actions.actWithTools'),
          ),
          new DefaultPatkaPromptDirective(
            'use-tools-for-actions',
            'Make the model use a tool when the user asks for an action.',
            createTextFromPatkaTextKey('prompt.actions.useToolsForActions'),
          ),
          new DefaultPatkaPromptDirective(
            'answer-directly',
            'Stop the model from calling a tool it does not need.',
            createTextFromPatkaTextKey('prompt.actions.answerDirectly'),
          ),
        ],
      ),
      new DefaultPatkaPromptDirective(
        'answer-style',
        'Long answers waste the attention of the user.',
        createTextFromPatkaTextKey('prompt.answerStyle'),
        [
          new DefaultPatkaPromptDirective(
            'answer-briefly',
            'Keep each answer short.',
            createTextFromPatkaTextKey('prompt.answerStyle.answerBriefly'),
          ),
          new DefaultPatkaPromptDirective(
            'no-filler',
            'Remove the words that carry no information.',
            createTextFromPatkaTextKey('prompt.answerStyle.noFiller'),
          ),
          new DefaultPatkaPromptDirective(
            'markdown',
            'Let the chat render the answer.',
            createTextFromPatkaTextKey('prompt.answerStyle.markdown'),
          ),
        ],
      ),
      new DefaultPatkaPromptDirective(
        'environment',
        'Let the model know where it acts.',
        createTextFromPatkaTextKey('prompt.environment'),
        [new WorkingDirectoryPromptDirective()],
      ),
      new DefaultPatkaPromptDirective(
        'tools-section',
        'Group what the model needs to act with tools.',
        createTextFromPatkaTextKey('prompt.tools'),
        [new ToolsPromptDirective()],
      ),
      new DefaultPatkaPromptDirective(
        'conversation',
        'Let the model know where the conversation starts and who speaks.',
        createTextFromPatkaTextKey('prompt.conversation'),
        [
          new DefaultPatkaPromptDirective(
            'conversation-introduction',
            'Tell the model what follows and that it answers as the assistant.',
            createTextFromPatkaTextKey('prompt.conversation.introduction'),
          ),
          new ContextPromptDirective(),
        ],
      ),
      new DefaultPatkaPromptDirective(
        'answer-cue',
        'Leave the model the cue to answer as the assistant.',
        createTextFromPatkaTextKey('prompt.answerCue'),
      ),
    ],
  );
}
