import {catchError, defer, type Observable, of} from 'rxjs';
import type {JsonObject, JsonValue} from '../json/json.ts';
import type {Option} from '../option/option.ts';
import {failure, type Try} from '../try/try.ts';
import type {PatkaTool} from './patka-tool.ts';

export class PatkaTools {
  private readonly patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>;

  constructor(patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>) {
    this.patkaTools = patkaTools;
  }

  list(): ReadonlyArray<PatkaTool<JsonObject, JsonValue>> {
    return this.patkaTools;
  }

  invoke(name: string, input: JsonObject): Observable<Try<Option<JsonValue>>> {
    return defer(() => {
      const patkaTool = this.patkaTools.find((candidate) => candidate.name === name);

      return patkaTool === undefined
        ? of(failure(new Error(`patka has no tool named "${name}"`)))
        : patkaTool.invoke(input);
    }).pipe(catchError((error: Error) => of(failure(error))));
  }
}
