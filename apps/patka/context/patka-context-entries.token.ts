import type {Observable} from 'rxjs';
import type {InjectionToken} from 'tsyringe';
import type {PatkaContextEntry} from './patka-context-entry.ts';

export const PATKA_CONTEXT_ENTRIES: InjectionToken<Observable<PatkaContextEntry>> =
  Symbol('PatkaContextEntries');
