import type {Observable} from 'rxjs';
import type {JsonObject, JsonValue} from '../json/json.ts';
import type {Option} from '../option/option.ts';
import type {Try} from '../try/try.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

export interface PatkaTool<InvocationInput extends JsonObject, InvocationOutput extends JsonValue> {
  readonly manual: PatkaToolManual;

  invoke(input: InvocationInput): Observable<Try<Option<InvocationOutput>>>;
}
