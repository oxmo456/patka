import {describe, expect, it} from 'vitest';
import {patkaToolLLMManual} from './patka-tool-llm-manual.ts';

describe('patkaToolLLMManual', () => {
  it('gathers the name, usage, input and output of a tool', () => {
    expect(
      patkaToolLLMManual(
        'foo',
        'Use it for foo.',
        {type: 'object', properties: {}, required: []},
        {type: 'string'},
      ),
    ).toEqual({
      name: 'foo',
      usage: 'Use it for foo.',
      input: {type: 'object', properties: {}, required: []},
      output: {type: 'string'},
    });
  });
});
