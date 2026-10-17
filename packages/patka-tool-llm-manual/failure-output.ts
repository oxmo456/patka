import type {JsonSchema} from '../json/json.ts';

export const FAILURE_OUTPUT: JsonSchema = {
  type: 'object',
  description: 'The tool failed.',
  properties: {
    type: {const: 'failure'},
    error: {type: 'string', description: 'Why the tool failed.'},
  },
  required: ['type', 'error'],
};
