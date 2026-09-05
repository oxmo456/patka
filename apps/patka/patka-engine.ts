import type { Observable } from "rxjs";
import type { PatkaAgent } from "./patka-agent.ts";
import { PatkaChat } from "./patka-chat.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

const PENDING_RESPONSE = "...";

export class PatkaEngine {
  private readonly patkaChat = new PatkaChat();
  private readonly patkaAgent: PatkaAgent;

  readonly chat: Observable<ReadonlyArray<PatkaChatEntry>> = this.patkaChat.entries;

  constructor(patkaAgent: PatkaAgent) {
    this.patkaAgent = patkaAgent;
  }

  pushUserPrompt(prompt: string): void {
    this.patkaChat.push(prompt);
    const pendingResponseId = this.patkaChat.push(PENDING_RESPONSE);

    this.patkaAgent
      .send({ message: prompt, id: pendingResponseId })
      .subscribe((response) => this.patkaChat.update(pendingResponseId, response.message));
  }
}
