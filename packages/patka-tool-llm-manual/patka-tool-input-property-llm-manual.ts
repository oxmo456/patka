import type {PatkaToolInputPropertyLLMManual} from './patka-tool-llm-manual-type.ts';
import {
  createPatkaToolLLMManualValueFromPatkaToolLLMManualValueName,
  type PatkaToolLLMManualScalarName,
  type PatkaToolLLMManualValueName,
} from './patka-tool-llm-manual-value.ts';

export function patkaToolInputPropertyLLMManual(
  name: string,
  patkaToolLLMManualValueName: PatkaToolLLMManualValueName,
  description: string,
  patkaToolLLMManualScalarName: PatkaToolLLMManualScalarName = 'string',
): PatkaToolInputPropertyLLMManual {
  return {
    type: 'PatkaToolInputPropertyLLMManual',
    name,
    description,
    value: createPatkaToolLLMManualValueFromPatkaToolLLMManualValueName(
      patkaToolLLMManualValueName,
      patkaToolLLMManualScalarName,
    ),
  };
}
