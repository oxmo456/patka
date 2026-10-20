import {defer, type Observable} from 'rxjs';
import type {JsonObject, JsonValue} from '../json/json.ts';
import type {PatkaTool} from './patka-tool.ts';

export class PatkaTools {
  private readonly patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>;

  constructor(patkaTools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>) {
    this.patkaTools = patkaTools;
  }

  list(): ReadonlyArray<PatkaTool<JsonObject, JsonValue>> {
    return this.patkaTools;
  }

  invoke(name: string, input: JsonObject): Observable<JsonValue> {
    return defer(() => {
      const patkaTool = this.patkaTools.find((candidate) => candidate.name === name);

      if (patkaTool === undefined) {
        throw new Error(`patka has no tool named "${name}"`);
      }

      return patkaTool.invoke(input);
    });
  }
}
