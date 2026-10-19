import type {JsonObject, JsonValue} from '../../../packages/json/json.ts';
import {ContextPromptDirective} from '../../../packages/patka-prompt/context-prompt-directive.ts';
import {DefaultPatkaPromptDirective} from '../../../packages/patka-prompt/default-patka-prompt-directive.ts';
import type {PatkaPromptDirective} from '../../../packages/patka-prompt/patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from '../../../packages/patka-prompt/patka-prompt-environment.ts';
import {ToolsPromptDirective} from '../../../packages/patka-prompt/tools-prompt-directive.ts';
import {WorkingDirectoryPromptDirective} from '../../../packages/patka-prompt/working-directory-prompt-directive.ts';
import type {PatkaTool} from '../../../packages/patka-tool/patka-tool.ts';
import {patkaToolLLMManualJsonSchema} from '../../../packages/patka-tool-llm-manual/patka-tool-llm-manual-json-schema.ts';
import {createTextFromPatkaTextKey} from '../text/patka-text.ts';

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
        [
          new WorkingDirectoryPromptDirective((workingDirectory: string) =>
            createTextFromPatkaTextKey('prompt.environment.workingDirectory', {workingDirectory}),
          ),
        ],
      ),
      new DefaultPatkaPromptDirective(
        'tools-section',
        'Group what the model needs to act with tools.',
        createTextFromPatkaTextKey('prompt.tools'),
        [
          new ToolsPromptDirective({
            introduction: createTextFromPatkaTextKey('prompt.tools.introduction'),
            tool: (patkaTool: PatkaTool<JsonObject, JsonValue>) => {
              const jsonSchema = patkaToolLLMManualJsonSchema(patkaTool.llmManual);

              return createTextFromPatkaTextKey('prompt.tools.tool', {
                name: patkaTool.name,
                usage: patkaTool.llmManual.input.description,
                input: JSON.stringify(jsonSchema.input),
                output: JSON.stringify(jsonSchema.output),
              });
            },
            protocol: [
              createTextFromPatkaTextKey('prompt.tools.protocol.singleLine'),
              createTextFromPatkaTextKey('prompt.tools.protocol.format'),
              createTextFromPatkaTextKey('prompt.tools.protocol.example'),
              createTextFromPatkaTextKey('prompt.tools.protocol.inputSchema'),
              createTextFromPatkaTextKey('prompt.tools.protocol.outputEnvelope'),
              createTextFromPatkaTextKey('prompt.tools.protocol.neverGuess'),
              createTextFromPatkaTextKey('prompt.tools.protocol.askWhenUnclear'),
            ],
          }),
        ],
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
          new ContextPromptDirective({
            userUtterance: (content: string) =>
              createTextFromPatkaTextKey('prompt.conversation.userUtterance', {content}),
            inferenceClientResponse: (content: string) =>
              createTextFromPatkaTextKey('prompt.conversation.inferenceClientResponse', {content}),
            agentUtterance: (content: string) =>
              createTextFromPatkaTextKey('prompt.conversation.agentUtterance', {content}),
            toolOutput: (output: string) =>
              createTextFromPatkaTextKey('prompt.conversation.toolOutput', {output}),
          }),
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
