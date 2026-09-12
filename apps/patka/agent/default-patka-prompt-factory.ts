import {match} from 'ts-pattern';
import type {PatkaRole} from '../patka-role.ts';
import type {PatkaToolManual} from '../tools/patka-tool-manual.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import type {PatkaTools} from '../tools/patka-tools.ts';
import type {PatkaConversation} from './patka-conversation.ts';
import type {PatkaPromptFactory} from './patka-prompt-factory.ts';

const INSTRUCTION =
  'Answer with the fewest words possible. No preamble, no restatement of the question, no markdown, no closing offer to help.';

const TOOLS_INTRODUCTION = 'You can use these tools:';

const LABEL: Record<PatkaRole, string> = {
  user: 'User',
  agent: 'Assistant',
};

const present = (manual: PatkaToolManual): string =>
  [
    `- ${manual.name}: ${manual.summary}`,
    `  usage: ${manual.usage}`,
    `  input: ${JSON.stringify(manual.input)}`,
    `  output: ${JSON.stringify(manual.output)}`,
  ].join('\n');

export class DefaultPatkaPromptFactory implements PatkaPromptFactory {
  private readonly patkaTools: PatkaTools;
  private readonly protocol = new PatkaToolProtocol();

  constructor(patkaTools: PatkaTools) {
    this.patkaTools = patkaTools;
  }

  private header(): string {
    const manuals = this.patkaTools.manuals();

    return manuals.length === 0
      ? INSTRUCTION
      : [
          INSTRUCTION,
          '',
          TOOLS_INTRODUCTION,
          ...manuals.map(present),
          '',
          this.protocol.manual,
        ].join('\n');
  }

  create(history: PatkaConversation): string {
    const spoken = history.flatMap((node) =>
      match(node.utterance)
        .with({type: 'some'}, (utterance) => [`${LABEL[node.role]}: ${utterance.value.content}`])
        .with({type: 'none'}, () => [])
        .exhaustive(),
    );

    return [this.header(), '', ...spoken, `${LABEL.agent}:`].join('\n');
  }
}
