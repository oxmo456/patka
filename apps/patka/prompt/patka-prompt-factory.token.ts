import type {InjectionToken} from 'tsyringe';
import type {PatkaPromptFactory} from '../../../packages/agent/prompt/patka-prompt-factory.ts';

export const PATKA_PROMPT_FACTORY: InjectionToken<PatkaPromptFactory> =
  Symbol('PatkaPromptFactory');
