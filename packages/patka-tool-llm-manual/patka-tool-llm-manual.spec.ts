import {describe, expect, it} from 'vitest';
import {patkaToolInputLLMManual} from './patka-tool-input-llm-manual.ts';
import {patkaToolLLMManual} from './patka-tool-llm-manual.ts';
import {patkaToolLLMManualNoOutput} from './patka-tool-llm-manual-no-output.ts';

describe('patkaToolLLMManual', () => {
  it('gathers the name, usage, input schema and output schema of a tool', () => {
    expect(
      patkaToolLLMManual(
        'foo',
        'Use it for foo.',
        patkaToolInputLLMManual(),
        patkaToolLLMManualNoOutput('Foo was done.'),
      ),
    ).toEqual({
      name: 'foo',
      usage: 'Use it for foo.',
      input: {type: 'object', properties: {}, required: []},
      output: {description: 'Foo was done.'},
    });
  });
});
