import {readFileSync} from 'node:fs';
import {Ajv} from 'ajv';
import {match} from 'ts-pattern';
import type {JsonValue} from '../json.ts';
import {failure, success, type Try} from '../try.ts';
import {ContextPromptDirective} from './context-prompt-directive.ts';
import {DefaultPatkaPromptDirective} from './default-patka-prompt-directive.ts';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';
import {ToolsPromptDirective} from './tools-prompt-directive.ts';
import {WorkingDirectoryPromptDirective} from './working-directory-prompt-directive.ts';

export type PatkaPromptDirectiveJson =
  | {
      readonly type: 'text';
      readonly name: string;
      readonly purpose: string;
      readonly text: string;
      readonly children?: ReadonlyArray<PatkaPromptDirectiveJson>;
    }
  | {readonly type: 'working-directory'}
  | {readonly type: 'tools'}
  | {readonly type: 'context'};

const PATKA_PROMPT_DIRECTIVE_JSON_SCHEMA = {
  $ref: '#/definitions/directive',
  definitions: {
    directive: {
      oneOf: [
        {
          type: 'object',
          properties: {
            type: {const: 'text'},
            name: {type: 'string'},
            purpose: {type: 'string'},
            text: {type: 'string'},
            children: {type: 'array', items: {$ref: '#/definitions/directive'}},
          },
          required: ['type', 'name', 'purpose', 'text'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: {type: {const: 'working-directory'}},
          required: ['type'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: {type: {const: 'tools'}},
          required: ['type'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: {type: {const: 'context'}},
          required: ['type'],
          additionalProperties: false,
        },
      ],
    },
  },
};

const ajv = new Ajv();

const validatePatkaPromptDirectiveJson = ajv.compile<PatkaPromptDirectiveJson>(
  PATKA_PROMPT_DIRECTIVE_JSON_SCHEMA,
);

export function createPatkaPromptDirectiveJsonFromJsonValue(
  jsonValue: JsonValue,
): Try<PatkaPromptDirectiveJson> {
  return validatePatkaPromptDirectiveJson(jsonValue)
    ? success(jsonValue)
    : failure(
        new Error(
          `the prompt directive is not valid: ${ajv.errorsText(validatePatkaPromptDirectiveJson.errors)}`,
        ),
      );
}

export function createPatkaPromptDirectiveFromJson(
  patkaPromptDirectiveJson: PatkaPromptDirectiveJson,
): PatkaPromptDirective<PatkaPromptEnvironment> {
  return match(patkaPromptDirectiveJson)
    .with(
      {type: 'text'},
      (textPatkaPromptDirectiveJson) =>
        new DefaultPatkaPromptDirective<PatkaPromptEnvironment>(
          textPatkaPromptDirectiveJson.name,
          textPatkaPromptDirectiveJson.purpose,
          textPatkaPromptDirectiveJson.text,
          (textPatkaPromptDirectiveJson.children ?? []).map(createPatkaPromptDirectiveFromJson),
        ),
    )
    .with({type: 'working-directory'}, () => new WorkingDirectoryPromptDirective())
    .with({type: 'tools'}, () => new ToolsPromptDirective())
    .with({type: 'context'}, () => new ContextPromptDirective())
    .exhaustive();
}

export function createPatkaPromptDirectiveFromUrl(
  url: URL,
): PatkaPromptDirective<PatkaPromptEnvironment> {
  const jsonValue: JsonValue = JSON.parse(readFileSync(url, 'utf8'));

  return match(createPatkaPromptDirectiveJsonFromJsonValue(jsonValue))
    .with({type: 'success'}, (success) => createPatkaPromptDirectiveFromJson(success.value))
    .with({type: 'failure'}, (failure) => {
      throw failure.error;
    })
    .exhaustive();
}
