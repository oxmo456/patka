import { BehaviorSubject, type Observable } from "rxjs";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

export class PatkaChat {
  private readonly _entries = new BehaviorSubject<ReadonlyArray<PatkaChatEntry>>([]);

  readonly entries: Observable<ReadonlyArray<PatkaChatEntry>> = this._entries.asObservable();

  push(entry: PatkaChatEntry): void {
    const entries = this._entries.value;
    const known = entries.some((existing) => existing.id === entry.id);

    this._entries.next(
      known
        ? entries.map((existing) => (existing.id === entry.id ? entry : existing))
        : [...entries, entry],
    );
  }
}
