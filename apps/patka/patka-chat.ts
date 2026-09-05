import { BehaviorSubject, type Observable } from "rxjs";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";
import type { PatkaMessage } from "./patka-message.ts";

export class PatkaChat {
  private readonly _entries = new BehaviorSubject<ReadonlyArray<PatkaChatEntry>>([]);

  readonly changes: Observable<ReadonlyArray<PatkaChatEntry>> = this._entries.asObservable();

  get entries(): ReadonlyArray<PatkaChatEntry> {
    return this._entries.value;
  }

  push(message: PatkaMessage): void {
    this._entries.next([...this._entries.value, { message }]);
  }
}
