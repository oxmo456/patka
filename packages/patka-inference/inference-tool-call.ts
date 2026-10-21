import type {JsonObject} from '../json/json.ts';

export type InferenceToolCall = {
  readonly name: string;
  readonly input: JsonObject;
};
