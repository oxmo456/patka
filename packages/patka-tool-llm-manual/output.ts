import type {JsonObject, JsonSchema} from '../json/json.ts';
import {FAILURE_OUTPUT} from './failure-output.ts';

export function output(value: JsonObject): JsonSchema {
  return {
    oneOf: [
      {
        type: 'object',
        description: 'The tool worked.',
        properties: {
          type: {const: 'success'},
          value: {
            type: 'object',
            properties: {type: {const: 'some'}, value},
            required: ['type', 'value'],
          },
        },
        required: ['type', 'value'],
      },
      FAILURE_OUTPUT,
    ],
  };
}
