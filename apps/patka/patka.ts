import {scan} from 'rxjs';
import {inject, injectable} from 'tsyringe';
import {PatkaEngine} from './chat/patka-engine.ts';
import {PatkaLogger} from './patka-logger.ts';
import {PATKA_UI} from './ui/patka-ui.token.ts';
import type {PatkaUI} from './ui/patka-ui.ts';
import {toPatkaUtterance} from './ui/patka-user-input.ts';

@injectable()
export class Patka {
  private readonly patkaEngine: PatkaEngine;
  private readonly patkaUI: PatkaUI;
  private readonly patkaLogger: PatkaLogger;

  constructor(
    @inject(PatkaEngine) patkaEngine: PatkaEngine,
    @inject(PATKA_UI) patkaUI: PatkaUI,
    @inject(PatkaLogger) patkaLogger: PatkaLogger,
  ) {
    this.patkaEngine = patkaEngine;
    this.patkaUI = patkaUI;
    this.patkaLogger = patkaLogger;

    this.patkaLogger.info({}, 'patka starts');

    this.patkaUI.userInputs.subscribe((patkaUserInput) =>
      this.patkaEngine.handle(toPatkaUtterance(patkaUserInput)),
    );
    this.patkaEngine.patkaChatEntries.subscribe((patkaChatEntries) =>
      this.patkaUI.updateChat(patkaChatEntries),
    );
    this.patkaLogger.logs
      .pipe(scan((logs: ReadonlyArray<string>, log: string) => [...logs, log].slice(-100), []))
      .subscribe((logs) => this.patkaUI.updateLogs(logs));
  }
}
