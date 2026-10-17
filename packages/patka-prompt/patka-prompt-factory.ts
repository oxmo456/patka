import type {PatkaContextEntry} from '../patka-context/patka-context-entry.ts';

export interface PatkaPromptFactory {
  create(patkaContextEntries: ReadonlyArray<PatkaContextEntry>): string;
}
