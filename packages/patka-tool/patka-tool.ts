import type {Observable} from 'rxjs';
import type {JsonObject, JsonValue} from '../json/json.ts';
import type {Option} from '../option/option.ts';
import type {PatkaToolLLMManual} from '../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import type {Try} from '../try/try.ts';

export interface PatkaTool<InvocationInput extends JsonObject, InvocationOutput extends JsonValue> {
  readonly llmManual: PatkaToolLLMManual;

  invoke(input: InvocationInput): Observable<Try<Option<InvocationOutput>>>;
}
