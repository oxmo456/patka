import type {InjectionToken} from 'tsyringe';
import type {PatkaUI} from './patka-ui.ts';

export const PATKA_UI: InjectionToken<PatkaUI> = Symbol('PatkaUI');
