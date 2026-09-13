import {defer, type Observable} from 'rxjs';
import {injectAll, injectable} from 'tsyringe';
import type {JsonObject, JsonValue} from '../json.ts';
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

  invoke(name: string, input: JsonObject): Observable<JsonValue> {
    return defer(() => {
      const patkaTool = this.patkaTools.find((candidate) => candidate.manual.name === name);

      if (patkaTool === undefined) {
        throw new Error(`patka has no tool named "${name}"`);
      }

      return patkaTool.invoke(input);
    });
  }
}
