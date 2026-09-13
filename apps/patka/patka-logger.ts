import pino, {type Logger} from 'pino';
import {type Observable, ReplaySubject} from 'rxjs';
import {singleton} from 'tsyringe';
import type {JsonObject} from './json.ts';

@singleton()
export class PatkaLogger {
  private readonly _logs = new ReplaySubject<string>(100);
  private readonly logger: Logger = pino(
    {},
    {
      write: (line: string): void => {
        this._logs.next(line.trim());
      },
    },
  );

  readonly logs: Observable<string> = this._logs.asObservable();

  info(message: string, details: JsonObject = {}): void {
    this.logger.info(details, message);
  }

  error(message: string, details: JsonObject = {}): void {
    this.logger.error(details, message);
  }
}
