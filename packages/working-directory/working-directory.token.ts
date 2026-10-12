import type {InjectionToken} from 'tsyringe';

export const WORKING_DIRECTORY: InjectionToken<string> = Symbol('WorkingDirectory');
