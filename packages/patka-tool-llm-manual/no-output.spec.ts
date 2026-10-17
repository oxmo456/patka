import {describe, expect, it} from 'vitest';
import {noOutput} from './no-output.ts';

describe('noOutput', () => {
  it('describes a success that holds no value, or a failure', () => {
    expect(noOutput('The report was sent.')).toEqual({
      oneOf: [
        {
          type: 'object',
          description: 'The report was sent.',
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
