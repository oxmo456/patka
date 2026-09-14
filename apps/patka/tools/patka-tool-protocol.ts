import type {JsonObject, JsonValue} from '../json.ts';
import {attempt, failure, type Try} from '../try.ts';

const MARKER = '$$$invoke';

const INVOCATION = /\$\$\$invoke\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*(\{[\s\S]*\})\s*\)/;

export type PatkaToolInvocation = {
  readonly name: string;
  readonly input: JsonObject;
};

export class PatkaToolProtocol {
  readonly manual: string = [
    'If you want to use a tool, reply with a single line and nothing else:',
    `${MARKER}(tool_name, {"key": "value"})`,
    `For example: ${MARKER}(read_file, {"path": "notes.txt"})`,
    'The input must be a JSON object matching that tool input schema.',
    'Never invoke a tool as a guess. Every input you give it must come from the request.',
    'If the request is empty, ambiguous, or not actionable, ask the user a question instead.',
  ].join('\n');

  isAPatkaToolInvocation(reply: string): boolean {
    return INVOCATION.test(reply);
  }

  progress(patkaToolInvocation: PatkaToolInvocation): string {
    return `using ${patkaToolInvocation.name}(${JSON.stringify(patkaToolInvocation.input)})…`;
  }

  outcome(reply: string, output: JsonValue): string {
    return [
      reply,
      `Tool output: ${JSON.stringify(output)}`,
      'Answer the user now, using that output. Use another tool only if you still cannot answer.',
    ].join('\n');
  }

  parse(reply: string): Try<PatkaToolInvocation> {
    const found = INVOCATION.exec(reply);

    return found === null
      ? failure(new Error(`no tool invocation to read in "${reply}"`))
      : attempt(() => ({name: found[1], input: JSON.parse(found[2])}));
  }
}
