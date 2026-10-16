import type {PatkaContextEntry} from '../patka-agent/context/patka-context-entry.ts';
import type {PatkaToolManual} from '../patka-agent/tools/patka-tool-manual.ts';

export type PatkaPromptEnvironment = {
  readonly workingDirectory: string;
  readonly patkaToolManuals: ReadonlyArray<PatkaToolManual>;
  readonly patkaContextEntries: ReadonlyArray<PatkaContextEntry>;
};
