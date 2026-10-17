import {Ajv} from 'ajv';
import {catchError, defer, type Observable, of} from 'rxjs';
import type {JsonObject, JsonValue} from '../json/json.ts';
import type {Option} from '../option/option.ts';
import type {PatkaToolLLMManual} from '../patka-tool-llm-manual/patka-tool-llm-manual.ts';
import {failure, type Try} from '../try/try.ts';
import type {PatkaTool} from './patka-tool.ts';

export class PatkaTools {
  private readonly patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>;
  private readonly ajv = new Ajv();

  constructor(patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>) {
    this.patkaTools = patkaTools;
  }

  llmManuals(): ReadonlyArray<PatkaToolLLMManual> {
    return this.patkaTools.map((patkaTool) => patkaTool.llmManual);
  }

  invoke(name: string, input: JsonObject): Observable<Try<Option<JsonValue>>> {
    return defer(() => {
      const patkaTool = this.patkaTools.find((candidate) => candidate.llmManual.name === name);

      return patkaTool === undefined
        ? of(failure(new Error(`patka has no tool named "${name}"`)))
        : this.invokeWithValidInput(patkaTool, input);
    }).pipe(catchError((error: Error) => of(failure(error))));
  }

  private invokeWithValidInput(
    patkaTool: PatkaTool<JsonObject, JsonValue>,
    input: JsonObject,
  ): Observable<Try<Option<JsonValue>>> {
    const validateFunction = this.ajv.compile(patkaTool.llmManual.input);

    return validateFunction(input)
      ? patkaTool.invoke(input)
      : of(
          failure(
            new Error(
              `the input of "${patkaTool.llmManual.name}" is not valid: ${this.ajv.errorsText(validateFunction.errors)}`,
            ),
          ),
        );
  }
}
