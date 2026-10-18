import {describe, expect, it} from 'vitest';
import {patkaToolOutputLLMManual} from './patka-tool-output-llm-manual.ts';

describe('patkaToolOutputLLMManual', () => {
  it('describes a string output', () => {
    expect(patkaToolOutputLLMManual('string', 'A text.')).toEqual({
      type: 'PatkaToolOutputLLMManual',
      description: 'A text.',
      value: {type: 'PatkaToolLLMManualString'},
    });
  });

  it('describes an array of strings output when no item type is given', () => {
    expect(patkaToolOutputLLMManual('array', 'Some names.')).toEqual({
      type: 'PatkaToolOutputLLMManual',
      description: 'Some names.',
      value: {type: 'PatkaToolLLMManualArray', items: {type: 'PatkaToolLLMManualString'}},
    });
  });
});
