import {describe, expect, it} from 'vitest';
import {patkaToolLLMManual} from './patka-tool-llm-manual.ts';

describe('patkaToolLLMManual', () => {
  it('gives an empty manual', () => {
    expect(patkaToolLLMManual()).toEqual({});
  });
});
