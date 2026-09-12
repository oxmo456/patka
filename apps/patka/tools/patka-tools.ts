import {defer, type Observable} from 'rxjs';
import type {JsonObject, JsonValue} from '../json.ts';
import type {PatkaTool} from './patka-tool.ts';
import type {PatkaToolManual} from './patka-tool-manual.ts';

export class PatkaTools {
  private readonly tools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>;

  constructor(tools: ReadonlyArray<PatkaTool<JsonObject, JsonValue>>) {
    this.tools = tools;
  }

  manuals(): ReadonlyArray<PatkaToolManual> {
    return this.tools.map((tool) => tool.manual);
  }

  invoke(name: string, input: JsonObject): Observable<JsonValue> {
    return defer(() => {
      const tool = this.tools.find((candidate) => candidate.manual.name === name);

      if (tool === undefined) {
        throw new Error(`patka has no tool named "${name}"`);
      }

      return tool.invoke(input);
    });
  }
}
