import type { Observable } from "rxjs";
import { match } from "ts-pattern";
import type { PatkaAgent } from "./patka-agent.ts";
import { PatkaChat } from "./patka-chat.ts";
import type { PatkaChatEntry, PatkaChatEntryStatus } from "./patka-chat-entry.ts";
import type { PatkaHistoryNode } from "./patka-history-node.ts";
import type { PatkaUtterance } from "./patka-utterance.ts";

const USER = "you";

const toChatEntry = (node: PatkaHistoryNode, author: string): PatkaChatEntry => ({
  id: node.id,
  role: node.role,
  author: node.role === "user" ? USER : author,
  message: match(node.utterance)
    .with({ type: "some" }, (utterance) => utterance.value.content)
    .with({ type: "none" }, () => "")
    .exhaustive(),
  status: match(node.utterance)
    .with({ type: "some" }, (): PatkaChatEntryStatus => "complete")
    .with({ type: "none" }, (): PatkaChatEntryStatus => "pending")
    .exhaustive(),
});

export class PatkaEngine {
  private readonly patkaChat = new PatkaChat();
  private readonly patkaAgent: PatkaAgent;

  readonly chat: Observable<ReadonlyArray<PatkaChatEntry>> = this.patkaChat.entries;

  constructor(patkaAgent: PatkaAgent) {
    this.patkaAgent = patkaAgent;
    patkaAgent.history.subscribe((history: ReadonlyArray<PatkaHistoryNode>): void => {
      for (const node of history) {
        this.patkaChat.push(toChatEntry(node, patkaAgent.name));
      }
    });
  }

  handle(utterance: PatkaUtterance): void {
    this.patkaAgent.handle(utterance);
  }
}
