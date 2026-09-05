import { randomUUID } from "node:crypto";
import { BehaviorSubject, type Observable } from "rxjs";
import type { PatkaAgent } from "./patka-agent.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";
import type { PatkaMessage } from "./patka-message.ts";

export class PatkaEngine {
  private readonly _chat = new BehaviorSubject<ReadonlyArray<PatkaChatEntry>>([]);
  private readonly patkaAgent: PatkaAgent;

  readonly chat: Observable<ReadonlyArray<PatkaChatEntry>> = this._chat.asObservable();

  constructor(patkaAgent: PatkaAgent) {
    this.patkaAgent = patkaAgent;
    this.patkaAgent.responses.subscribe((response) => this.pushChatEntry(response));
  }

  pushUserPrompt(prompt: string): void {
    this.pushChatEntry({ message: prompt, id: randomUUID() });
    this.patkaAgent.send(prompt);
  }

  private pushChatEntry(message: PatkaMessage): void {
    this._chat.next([...this._chat.value, { message }]);
  }
}
