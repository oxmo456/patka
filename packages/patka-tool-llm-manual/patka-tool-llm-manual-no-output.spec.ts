import {describe, expect, it} from 'vitest';
import {patkaToolLLMManualNoOutput} from './patka-tool-llm-manual-no-output.ts';

describe('patkaToolLLMManualNoOutput', () => {
  it('describes a tool without output', () => {
    expect(patkaToolLLMManualNoOutput('The report was sent.')).toEqual({
      type: 'PatkaToolLLMManualNoOutput',
      description: 'The report was sent.',
    });
  });
});
