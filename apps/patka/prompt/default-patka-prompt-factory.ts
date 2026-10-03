import {readFileSync} from 'node:fs';
import {match} from 'ts-pattern';
import type {PatkaContextEntry} from '../context/patka-context-entry.ts';
import {isSome} from '../option.ts';
import type {PatkaToolManual} from '../tools/patka-tool-manual.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import type {PatkaTools} from '../tools/patka-tools.ts';
import type {PatkaPromptFactory} from './patka-prompt-factory.ts';

const INSTRUCTION = readFileSync(new URL('./instruction.md', import.meta.url), 'utf8').trim();

const TOOLS_INTRODUCTION = 'You can use these tools:';

const USER = 'User';

const ASSISTANT = 'Assistant';

const presentManual = (patkaToolManual: PatkaToolManual): string =>
  [
    `- ${patkaToolManual.name}: ${patkaToolManual.summary}`,
    `  usage: ${patkaToolManual.usage}`,
    `  input: ${JSON.stringify(patkaToolManual.input)}`,
    `  output: ${JSON.stringify(patkaToolManual.output)}`,
  ].join('\n');

const present = (patkaContextEntry: PatkaContextEntry): ReadonlyArray<string> =>
  match(patkaContextEntry)
    .with({type: 'PatkaUserUtterance'}, ({utterance}) => [`${USER}: ${utterance.content}`])
    .with({type: 'PatkaInferenceClientResponse'}, ({content}) => [`${ASSISTANT}: ${content}`])
    .with({type: 'PatkaToolCall'}, () => [])
    .with({type: 'PatkaUserNotification'}, () => [])
    .with({type: 'PatkaError'}, () => [])
    .with({type: 'PatkaToolResult'}, ({output}) => [
      `Tool output: ${isSome(output) ? JSON.stringify(output.value) : 'none'}`,
    ])
    .exhaustive();

export class DefaultPatkaPromptFactory implements PatkaPromptFactory {
  private readonly patkaTools: PatkaTools;
  private readonly patkaToolProtocol = new PatkaToolProtocol();

  constructor(patkaTools: PatkaTools) {
    this.patkaTools = patkaTools;
  }

  private header(): string {
    const patkaToolManuals = this.patkaTools.manuals();

    return patkaToolManuals.length === 0
      ? INSTRUCTION
      : [
          INSTRUCTION,
          '',
          TOOLS_INTRODUCTION,
          ...patkaToolManuals.map(presentManual),
          '',
          this.patkaToolProtocol.manual,
        ].join('\n');
  }

  create(patkaContextEntries: ReadonlyArray<PatkaContextEntry>): string {
    const spoken = patkaContextEntries.flatMap(present);

    return [this.header(), '', ...spoken, `${ASSISTANT}:`].join('\n');
  }
}
