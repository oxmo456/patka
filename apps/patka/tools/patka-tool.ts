import type {Observable} from 'rxjs';
import type {JsonObject, JsonValue} from '../json.ts';
import type {Option} from '../option.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

export interface PatkaTool<InvocationInput extends JsonObject, InvocationOutput extends JsonValue> {
  readonly manual: PatkaToolManual;

  invoke(input: InvocationInput): Observable<Option<InvocationOutput>>;
}
