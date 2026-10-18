import type {PatkaToolLLMManualNoOutput} from './patka-tool-llm-manual-type.ts';

export function patkaToolLLMManualNoOutput(description: string): PatkaToolLLMManualNoOutput {
  return {type: 'PatkaToolLLMManualNoOutput', description};
}
