import type {JsonObject, JsonValue} from '../json/json.ts';
import type {PatkaContextEntry} from '../patka-context/patka-context-entry.ts';
import type {PatkaTool} from '../patka-tool/patka-tool.ts';

export type PatkaPromptEnvironment = {
  readonly workingDirectory: string;
  readonly patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>;
  readonly patkaContextEntries: ReadonlyArray<PatkaContextEntry>;
};
