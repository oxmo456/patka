import type {InjectionToken} from 'tsyringe';
import type {PatkaPromptDirective} from './patka-prompt-directive.ts';
import type {PatkaPromptEnvironment} from './patka-prompt-environment.ts';

export const PATKA_PROMPT_DIRECTIVE: InjectionToken<PatkaPromptDirective<PatkaPromptEnvironment>> =
  Symbol('PatkaPromptDirective');
