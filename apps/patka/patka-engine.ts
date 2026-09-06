import type { Observable } from "rxjs";
import type { PatkaAgent } from "./patka-agent.ts";
import { PatkaChat } from "./patka-chat.ts";
import type { PatkaChatEntry, PatkaChatEntryStatus } from "./patka-chat-entry.ts";
import type { PatkaPrompt } from "./patka-prompt.ts";
import type { PatkaTurn, PatkaTurnStatus } from "./patka-turn.ts";

const USER = "you";

const CHAT_ENTRY_STATUS: Record<PatkaTurnStatus, PatkaChatEntryStatus> = {
  pending: "pending",
  answered: "complete",
  failed: "failed",
};

const toChatEntries = (turn: PatkaTurn, author: string): ReadonlyArray<PatkaChatEntry> => [
  {
    id: turn.prompt.id,
    author: USER,
    message: turn.prompt.content,
    status: "complete",
  },
  {
    id: turn.id,
    author,
    message: turn.response ?? "",
    status: CHAT_ENTRY_STATUS[turn.status],
  },
];

export class PatkaEngine {
  private readonly patkaChat = new PatkaChat();
  private readonly patkaAgent: PatkaAgent;

  readonly chat: Observable<ReadonlyArray<PatkaChatEntry>> = this.patkaChat.entries;

  constructor(patkaAgent: PatkaAgent) {
    this.patkaAgent = patkaAgent;
    patkaAgent.turns.subscribe((turn: PatkaTurn): void => {
      for (const entry of toChatEntries(turn, patkaAgent.name)) {
        this.patkaChat.push(entry);
      }
    });
  }

  askPatka(prompt: PatkaPrompt): void {
    this.patkaAgent.ask(prompt);
  }
}
