import {match} from 'ts-pattern';
import type {PatkaRole} from '../patka-role.ts';
import type {PatkaToolManual} from '../tools/patka-tool-manual.ts';
import {PatkaToolProtocol} from '../tools/patka-tool-protocol.ts';
import type {PatkaTools} from '../tools/patka-tools.ts';
import type {PatkaConversation} from './patka-conversation.ts';
import type {PatkaPromptFactory} from './patka-prompt-factory.ts';

const INSTRUCTION =
  'Answer with the fewest words possible. No preamble, no restatement of the question, no closing offer to help. Write the answer in markdown.';

const TOOLS_INTRODUCTION = 'You can use these tools:';

const LABEL: Record<PatkaRole, string> = {
  user: 'User',
  agent: 'Assistant',
};

const present = (patkaToolManual: PatkaToolManual): string =>
  [
    `- ${patkaToolManual.name}: ${patkaToolManual.summary}`,
    `  usage: ${patkaToolManual.usage}`,
    `  input: ${JSON.stringify(patkaToolManual.input)}`,
    `  output: ${JSON.stringify(patkaToolManual.output)}`,
  ].join('\n');

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
          ...patkaToolManuals.map(present),
          '',
          this.patkaToolProtocol.manual,
        ].join('\n');
  }

  create(patkaConversation: PatkaConversation): string {
    const spoken = patkaConversation.flatMap((patkaConversationEntry) =>
      match(patkaConversationEntry.utterance)
        .with({type: 'some'}, (utterance) => [
          `${LABEL[patkaConversationEntry.role]}: ${utterance.value.content}`,
        ])
        .with({type: 'none'}, () => [])
        .exhaustive(),
    );

    return [this.header(), '', ...spoken, `${LABEL.agent}:`].join('\n');
  }
}
