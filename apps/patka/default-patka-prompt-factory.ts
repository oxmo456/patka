import { isSome } from "./option.ts";
import type { PatkaHistoryNode } from "./patka-history-node.ts";
import type { PatkaPromptFactory } from "./patka-prompt-factory.ts";
import type { PatkaRole } from "./patka-role.ts";

const LABEL: Record<PatkaRole, string> = {
  user: "User",
  agent: "Assistant",
};

export class DefaultPatkaPromptFactory implements PatkaPromptFactory {
  create(history: ReadonlyArray<PatkaHistoryNode>): string {
    const spoken = history.flatMap((node) =>
      isSome(node.utterance) ? [`${LABEL[node.role]}: ${node.utterance.value.content}`] : [],
    );

    return [...spoken, `${LABEL.agent}:`].join("\n");
  }
}
