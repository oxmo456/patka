import {BehaviorSubject, type Observable} from 'rxjs';
import type {PatkaChatEntry} from './patka-chat-entry.ts';

export class PatkaChat {
  private readonly _patkaChatEntries = new BehaviorSubject<ReadonlyArray<PatkaChatEntry>>([]);

  readonly patkaChatEntries: Observable<ReadonlyArray<PatkaChatEntry>> =
    this._patkaChatEntries.asObservable();

  push(patkaChatEntry: PatkaChatEntry): void {
    const patkaChatEntries = this._patkaChatEntries.value;
    const known = patkaChatEntries.some((existing) => existing.id === patkaChatEntry.id);

    this._patkaChatEntries.next(
      known
        ? patkaChatEntries.map((existing) =>
            existing.id === patkaChatEntry.id ? patkaChatEntry : existing,
          )
        : [...patkaChatEntries, patkaChatEntry],
    );
  }
}
