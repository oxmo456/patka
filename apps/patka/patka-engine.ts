import type { Observable } from "rxjs";
import { isSome } from "./option.ts";
import type { PatkaAgent } from "./patka-agent.ts";
import { PatkaChat } from "./patka-chat.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";
import type { PatkaHistoryNode } from "./patka-history-node.ts";
import type { PatkaUtterance } from "./patka-utterance.ts";

const USER = "you";

const toChatEntry = (node: PatkaHistoryNode, author: string): PatkaChatEntry => ({
  id: node.id,
  role: node.role,
  author: node.role === "user" ? USER : author,
  message: isSome(node.utterance) ? node.utterance.value.content : "",
  status: isSome(node.utterance) ? "complete" : "pending",
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
