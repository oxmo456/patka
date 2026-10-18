import {describe, expect, it} from 'vitest';
import {patkaToolInputLLMManual} from './patka-tool-input-llm-manual.ts';
import {patkaToolInputPropertyLLMManual} from './patka-tool-input-property-llm-manual.ts';

describe('patkaToolInputLLMManual', () => {
  it('gathers its properties', () => {
    expect(
      patkaToolInputLLMManual(patkaToolInputPropertyLLMManual('name', 'string', 'A name.')),
    ).toEqual({
      type: 'PatkaToolInputLLMManual',
      properties: [
        {
          type: 'PatkaToolInputPropertyLLMManual',
          name: 'name',
          description: 'A name.',
          value: {type: 'PatkaToolLLMManualString'},
        },
      ],
    });
  });

  it('gathers no property', () => {
    expect(patkaToolInputLLMManual()).toEqual({type: 'PatkaToolInputLLMManual', properties: []});
  });
});
