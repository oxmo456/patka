import {Ajv} from 'ajv';
import {catchError, defer, type Observable, of} from 'rxjs';
import type {JsonObject, JsonValue} from '../json/json.ts';
import type {Option} from '../option/option.ts';
import {failure, type Try} from '../try/try.ts';
import type {PatkaTool} from './patka-tool.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

export class PatkaTools {
  private readonly patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>;
  private readonly ajv = new Ajv();

  constructor(patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>) {
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
        : this.invokeWithValidInput(patkaTool, input);
    }).pipe(catchError((error: Error) => of(failure(error))));
  }

  private invokeWithValidInput(
    patkaTool: PatkaTool<JsonObject, JsonValue>,
    input: JsonObject,
  ): Observable<Try<Option<JsonValue>>> {
    const validateFunction = this.ajv.compile(patkaTool.manual.input);

    return validateFunction(input)
      ? patkaTool.invoke(input)
      : of(
          failure(
            new Error(
              `the input of "${patkaTool.manual.name}" is not valid: ${this.ajv.errorsText(validateFunction.errors)}`,
            ),
          ),
        );
  }
}
