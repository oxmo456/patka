import { BehaviorSubject, type Observable } from "rxjs";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";
import type { PatkaMessage } from "./patka-message.ts";

export class PatkaChat {
  private readonly _entries = new BehaviorSubject<ReadonlyArray<PatkaChatEntry>>([]);

  readonly entries: Observable<ReadonlyArray<PatkaChatEntry>> = this._entries.asObservable();

  push(message: PatkaMessage): void {
    this._entries.next([...this._entries.value, { message }]);
  }
}
