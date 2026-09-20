import type {PatkaContextEntry} from '../context/patka-context-entry.ts';

export interface PatkaPromptFactory {
  create(patkaContextEntries: ReadonlyArray<PatkaContextEntry>): string;
}
