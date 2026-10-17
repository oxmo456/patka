import type {PatkaContextEntry} from '../patka-context/patka-context-entry.ts';
import type {PatkaToolLLMManual} from '../patka-tool-llm-manual/patka-tool-llm-manual.ts';

export type PatkaPromptEnvironment = {
  readonly workingDirectory: string;
  readonly patkaToolLLMManuals: ReadonlyArray<PatkaToolLLMManual>;
  readonly patkaContextEntries: ReadonlyArray<PatkaContextEntry>;
};
