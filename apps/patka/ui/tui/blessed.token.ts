import type {InjectionToken} from 'tsyringe';
import type {Blessed} from './patka-tui.ts';

export const BLESSED: InjectionToken<Blessed> = Symbol('Blessed');
