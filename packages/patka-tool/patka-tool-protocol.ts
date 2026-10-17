import type {JsonObject} from '../json/json.ts';
import {attempt, failure, type Try} from '../try/try.ts';

const INVOCATION = /\$\$\$invoke\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*(\{[\s\S]*\})\s*\)/;

export type PatkaToolInvocation = {
  readonly name: string;
  readonly input: JsonObject;
};

export class PatkaToolProtocol {
  isAPatkaToolInvocation(reply: string): boolean {
    return INVOCATION.test(reply);
  }

  progress(patkaToolInvocation: PatkaToolInvocation): string {
    return `using ${patkaToolInvocation.name}(${JSON.stringify(patkaToolInvocation.input)})…`;
  }

  parse(reply: string): Try<PatkaToolInvocation> {
    const found = INVOCATION.exec(reply);

    return found === null
      ? failure(new Error(`no tool invocation to read in "${reply}"`))
      : attempt(() => ({name: found[1], input: JSON.parse(found[2])}));
  }
}
