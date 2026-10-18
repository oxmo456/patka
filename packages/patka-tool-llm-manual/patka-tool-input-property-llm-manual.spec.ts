import {describe, expect, it} from 'vitest';
import {patkaToolInputPropertyLLMManual} from './patka-tool-input-property-llm-manual.ts';

describe('patkaToolInputPropertyLLMManual', () => {
  it('names a string', () => {
    expect(patkaToolInputPropertyLLMManual('relativePath', 'string', 'A path.')).toEqual({
      type: 'PatkaToolInputPropertyLLMManual',
      name: 'relativePath',
      description: 'A path.',
      value: {type: 'PatkaToolLLMManualString'},
    });
  });

  it('names a number', () => {
    expect(patkaToolInputPropertyLLMManual('count', 'number', 'A count.')).toEqual({
      type: 'PatkaToolInputPropertyLLMManual',
      name: 'count',
      description: 'A count.',
      value: {type: 'PatkaToolLLMManualNumber'},
    });
  });

  it('names a boolean', () => {
    expect(patkaToolInputPropertyLLMManual('recursive', 'boolean', 'A flag.')).toEqual({
      type: 'PatkaToolInputPropertyLLMManual',
      name: 'recursive',
      description: 'A flag.',
      value: {type: 'PatkaToolLLMManualBoolean'},
    });
  });

  it('names an array of numbers', () => {
    expect(patkaToolInputPropertyLLMManual('sizes', 'array', 'Some sizes.', 'number')).toEqual({
      type: 'PatkaToolInputPropertyLLMManual',
      name: 'sizes',
      description: 'Some sizes.',
      value: {type: 'PatkaToolLLMManualArray', items: {type: 'PatkaToolLLMManualNumber'}},
    });
  });

  it('names an array of strings when no item type is given', () => {
    expect(patkaToolInputPropertyLLMManual('names', 'array', 'Some names.')).toEqual({
      type: 'PatkaToolInputPropertyLLMManual',
      name: 'names',
      description: 'Some names.',
      value: {type: 'PatkaToolLLMManualArray', items: {type: 'PatkaToolLLMManualString'}},
    });
  });
});
