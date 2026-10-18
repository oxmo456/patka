import type {PatkaToolOutputLLMManual} from './patka-tool-llm-manual-type.ts';
import {
  createPatkaToolLLMManualValueFromPatkaToolLLMManualValueName,
  type PatkaToolLLMManualScalarName,
  type PatkaToolLLMManualValueName,
} from './patka-tool-llm-manual-value.ts';

export function patkaToolOutputLLMManual(
  patkaToolLLMManualValueName: PatkaToolLLMManualValueName,
  description: string,
  patkaToolLLMManualScalarName: PatkaToolLLMManualScalarName = 'string',
): PatkaToolOutputLLMManual {
  return {
    type: 'PatkaToolOutputLLMManual',
    description,
    value: createPatkaToolLLMManualValueFromPatkaToolLLMManualValueName(
      patkaToolLLMManualValueName,
      patkaToolLLMManualScalarName,
    ),
  };
}
