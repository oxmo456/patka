import type {PatkaContextEntry} from '../../../packages/patka-agent/context/patka-context-entry.ts';
import type {PatkaToolManual} from '../../../packages/patka-agent/tools/patka-tool-manual.ts';

export type PatkaPromptEnvironment = {
  readonly workingDirectory: string;
  readonly patkaToolManuals: ReadonlyArray<PatkaToolManual>;
  readonly patkaContextEntries: ReadonlyArray<PatkaContextEntry>;
};
