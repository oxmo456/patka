import { randomUUID } from "node:crypto";
import type { Observable } from "rxjs";
import type { PatkaAgent } from "./patka-agent.ts";
import { PatkaChat } from "./patka-chat.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

export class PatkaEngine {
  private readonly patkaChat = new PatkaChat();
  private readonly patkaAgent: PatkaAgent;

  readonly chat: Observable<ReadonlyArray<PatkaChatEntry>> = this.patkaChat.entries;

  constructor(patkaAgent: PatkaAgent) {
    this.patkaAgent = patkaAgent;
    this.patkaAgent.responses.subscribe((response) => this.patkaChat.push(response));
  }

  pushUserPrompt(prompt: string): void {
    this.patkaChat.push({ message: prompt, id: randomUUID() });
    this.patkaAgent.send(prompt);
  }
}
