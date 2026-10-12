import type {JsonObject, JsonValue} from '../../../packages/json/json.ts';
import type {Option} from '../../../packages/option/option.ts';
import {isSuccess, type Try} from '../../../packages/try/try.ts';

export function createJsonFromToolTry(attempted: Try<Option<JsonValue>>): JsonObject {
  return isSuccess(attempted)
    ? {type: 'success', value: attempted.value}
    : {type: 'failure', error: attempted.error.message};
}
