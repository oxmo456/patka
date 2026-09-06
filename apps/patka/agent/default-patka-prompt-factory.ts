import { match } from "ts-pattern";
import type { PatkaRole } from "../patka-role.ts";
import type { PatkaConversation, PatkaConversationEntry } from "./patka-conversation.ts";
import type { PatkaPromptFactory } from "./patka-prompt-factory.ts";

const INSTRUCTION =
  "Answer with the fewest words possible. No preamble, no restatement of the question, no markdown, no closing offer to help.";

const LABEL: Record<PatkaRole, string> = {
  user: "User",
  agent: "Assistant",
};

export class DefaultPatkaPromptFactory implements PatkaPromptFactory {
  create(history: PatkaConversation): string {
    const spoken = history.flatMap((node) =>
      match(node.utterance)
        .with({ type: "some" }, (utterance) => [`${LABEL[node.role]}: ${utterance.value.content}`])
        .with({ type: "none" }, () => [])
        .exhaustive(),
    );

    return [INSTRUCTION, "", ...spoken, `${LABEL.agent}:`].join("\n");
  }
}
