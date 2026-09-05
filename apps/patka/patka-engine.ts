import { randomUUID } from "node:crypto";
import { BehaviorSubject, type Observable } from "rxjs";
import type { PatkaAgent } from "./patka-agent.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

export class PatkaEngine {
  private readonly _chat = new BehaviorSubject<PatkaChatEntry[]>([]);
  private readonly patkaAgent: PatkaAgent;

  readonly chat: Observable<PatkaChatEntry[]> = this._chat.asObservable();

  constructor(patkaAgent: PatkaAgent) {
    this.patkaAgent = patkaAgent;
  }

  send(prompt: string): void {
    this._chat.next([...this._chat.value, { message: { message: prompt, id: randomUUID() } }]);
  }
}
