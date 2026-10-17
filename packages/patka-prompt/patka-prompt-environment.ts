import type {PatkaContextEntry} from '../patka-context/patka-context-entry.ts';
import type {PatkaToolManual} from '../patka-tool/patka-tool-manual.ts';

export type PatkaPromptEnvironment = {
  readonly workingDirectory: string;
  readonly patkaToolManuals: ReadonlyArray<PatkaToolManual>;
  readonly patkaContextEntries: ReadonlyArray<PatkaContextEntry>;
};
