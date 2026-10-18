import type {JSONSchema7} from 'json-schema';
import {
  createJSONSchema7FromPatkaToolLLMManualType,
  type PatkaToolInputLLMManual,
  type PatkaToolLLMManualNoOutput,
  type PatkaToolOutputLLMManual,
} from './patka-tool-llm-manual-type.ts';

export type PatkaToolLLMManual = {
  readonly name: string;
  readonly usage: string;
  readonly input: JSONSchema7;
  readonly output: JSONSchema7;
};

export function patkaToolLLMManual(
  name: string,
  usage: string,
  patkaToolInputLLMManual: PatkaToolInputLLMManual,
  patkaToolOutputLLMManual: PatkaToolOutputLLMManual | PatkaToolLLMManualNoOutput,
): PatkaToolLLMManual {
  return {
    name,
    usage,
    input: createJSONSchema7FromPatkaToolLLMManualType(patkaToolInputLLMManual),
    output: createJSONSchema7FromPatkaToolLLMManualType(patkaToolOutputLLMManual),
  };
}
