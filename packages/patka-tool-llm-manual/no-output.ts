import type {JsonSchema} from '../json/json.ts';
import {FAILURE_OUTPUT} from './failure-output.ts';

export function noOutput(description: string): JsonSchema {
  return {
    oneOf: [
      {
        type: 'object',
        description,
        properties: {
          type: {const: 'success'},
          value: {
            type: 'object',
            properties: {type: {const: 'none'}},
            required: ['type'],
          },
        },
        required: ['type', 'value'],
      },
      FAILURE_OUTPUT,
    ],
  };
}
