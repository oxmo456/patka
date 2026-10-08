import {catchError, defer, type Observable, of} from 'rxjs';
import {injectAll, injectable} from 'tsyringe';
import type {JsonObject, JsonValue} from '../json.ts';
import type {Option} from '../option.ts';
import {failure, type Try} from '../try.ts';
import {PATKA_TOOL} from './patka-tool.token.ts';
import type {PatkaTool} from './patka-tool.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

@injectable()
export class PatkaTools {
  private readonly patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>;

  constructor(@injectAll(PATKA_TOOL) patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>) {
    this.patkaTools = patkaTools;
  }

  manuals(): ReadonlyArray<PatkaToolManual> {
    return this.patkaTools.map((patkaTool) => patkaTool.manual);
  }

  invoke(name: string, input: JsonObject): Observable<Try<Option<JsonValue>>> {
    return defer(() => {
      const patkaTool = this.patkaTools.find((candidate) => candidate.manual.name === name);

      return patkaTool === undefined
        ? of(failure(new Error(`patka has no tool named "${name}"`)))
        : patkaTool.invoke(input);
    }).pipe(catchError((error: Error) => of(failure(error))));
  }
}
