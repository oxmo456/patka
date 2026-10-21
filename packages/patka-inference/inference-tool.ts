import type {JsonObject} from '../json/json.ts';

export type InferenceTool = {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: JsonObject;
};
