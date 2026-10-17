import {describe, expect, it} from 'vitest';
import {output} from './output.ts';

describe('output', () => {
  it('describes a success that holds some value, or a failure', () => {
    expect(output({type: 'string'})).toEqual({
      oneOf: [
        {
          type: 'object',
          description: 'The tool worked.',
          properties: {
            type: {const: 'success'},
            value: {
              type: 'object',
              properties: {type: {const: 'some'}, value: {type: 'string'}},
              required: ['type', 'value'],
            },
          },
          required: ['type', 'value'],
        },
        {
          type: 'object',
          description: 'The tool failed.',
          properties: {
            type: {const: 'failure'},
            error: {type: 'string', description: 'Why the tool failed.'},
          },
          required: ['type', 'error'],
        },
      ],
    });
  });
});
