import {match} from 'ts-pattern';
import type {
  PatkaToolLLMManualScalar,
  PatkaToolLLMManualValue,
} from './patka-tool-llm-manual-type.ts';

export type PatkaToolLLMManualScalarName = 'string' | 'number' | 'boolean';

export type PatkaToolLLMManualValueName = PatkaToolLLMManualScalarName | 'array';

function createPatkaToolLLMManualScalarFromPatkaToolLLMManualScalarName(
  patkaToolLLMManualScalarName: PatkaToolLLMManualScalarName,
): PatkaToolLLMManualScalar {
  return match(patkaToolLLMManualScalarName)
    .returnType<PatkaToolLLMManualScalar>()
    .with('string', () => ({type: 'PatkaToolLLMManualString'}))
    .with('number', () => ({type: 'PatkaToolLLMManualNumber'}))
    .with('boolean', () => ({type: 'PatkaToolLLMManualBoolean'}))
    .exhaustive();
}

export function createPatkaToolLLMManualValueFromPatkaToolLLMManualValueName(
  patkaToolLLMManualValueName: PatkaToolLLMManualValueName,
  patkaToolLLMManualScalarName: PatkaToolLLMManualScalarName,
): PatkaToolLLMManualValue {
  return patkaToolLLMManualValueName === 'array'
    ? {
        type: 'PatkaToolLLMManualArray',
        items: createPatkaToolLLMManualScalarFromPatkaToolLLMManualScalarName(
          patkaToolLLMManualScalarName,
        ),
      }
    : createPatkaToolLLMManualScalarFromPatkaToolLLMManualScalarName(patkaToolLLMManualValueName);
}
