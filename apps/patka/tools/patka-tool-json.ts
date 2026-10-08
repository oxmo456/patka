import type {JsonObject, JsonValue} from '../json.ts';
import type {Option} from '../option.ts';
import {isSuccess, type Try} from '../try.ts';

export function createJsonFromToolTry(attempted: Try<Option<JsonValue>>): JsonObject {
  return isSuccess(attempted)
    ? {type: 'success', value: attempted.value}
    : {type: 'failure', error: attempted.error.message};
}
