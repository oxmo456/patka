import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import type {PatkaToolManual} from '../tools/patka-tool-manual.ts';

export type PatkaPromptEnvironment = {
  readonly workingDirectory: string;
  readonly patkaToolManuals: ReadonlyArray<PatkaToolManual>;
  readonly patkaContextEntries: ReadonlyArray<PatkaContextEntry>;
};
