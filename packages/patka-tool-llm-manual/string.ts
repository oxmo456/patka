import type {JsonObject} from '../json/json.ts';

export function string(description?: string): JsonObject {
  return description === undefined ? {type: 'string'} : {type: 'string', description};
}
