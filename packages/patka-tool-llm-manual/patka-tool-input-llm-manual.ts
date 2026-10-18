import type {
  PatkaToolInputLLMManual,
  PatkaToolInputPropertyLLMManual,
} from './patka-tool-llm-manual-type.ts';

export function patkaToolInputLLMManual(
  ...patkaToolInputPropertyLLMManuals: ReadonlyArray<PatkaToolInputPropertyLLMManual>
): PatkaToolInputLLMManual {
  return {type: 'PatkaToolInputLLMManual', properties: patkaToolInputPropertyLLMManuals};
}
