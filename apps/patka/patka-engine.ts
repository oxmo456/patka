import type { Observable } from "rxjs";
import { isSome } from "./option.ts";
import type { PatkaAgent } from "./patka-agent.ts";
import { PatkaChat } from "./patka-chat.ts";
import type { PatkaChatEntry, PatkaChatEntryStatus } from "./patka-chat-entry.ts";
import type { PatkaExchange, PatkaExchangeStatus } from "./patka-exchange.ts";
import type { PatkaUtterance } from "./patka-utterance.ts";

const USER = "you";

const CHAT_ENTRY_STATUS: Record<PatkaExchangeStatus, PatkaChatEntryStatus> = {
  pending: "pending",
  answered: "complete",
  failed: "failed",
};

const toChatEntries = (exchange: PatkaExchange, author: string): ReadonlyArray<PatkaChatEntry> => [
  {
    id: exchange.utterance.id,
    origin: "user",
    author: USER,
    message: exchange.utterance.content,
    status: "complete",
  },
  {
    id: exchange.id,
    origin: "agent",
    author,
    message: isSome(exchange.response) ? exchange.response.value.content : "",
    status: CHAT_ENTRY_STATUS[exchange.status],
  },
];

export class PatkaEngine {
  private readonly patkaChat = new PatkaChat();
  private readonly patkaAgent: PatkaAgent;

  readonly chat: Observable<ReadonlyArray<PatkaChatEntry>> = this.patkaChat.entries;

  constructor(patkaAgent: PatkaAgent) {
    this.patkaAgent = patkaAgent;
    patkaAgent.exchanges.subscribe((exchange: PatkaExchange): void => {
      for (const entry of toChatEntries(exchange, patkaAgent.name)) {
        this.patkaChat.push(entry);
      }
    });
  }

  handle(utterance: PatkaUtterance): void {
    this.patkaAgent.handle(utterance);
  }
}
