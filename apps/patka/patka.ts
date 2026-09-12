import blessed from 'blessed';
import {PatkaAgent} from './agent/patka-agent.ts';
import {PatkaEngine} from './chat/patka-engine.ts';
import {
  buildInferenceClient,
  type PatkaInferenceClientOption,
} from './inference/patka-inference.ts';
import {PatkaLogger} from './patka-logger.ts';
import {ListFiles} from './tools/list-files.ts';
import {PatkaTools} from './tools/patka-tools.ts';
import {ReadFile} from './tools/read-file.ts';
import {PatkaTUI} from './ui/patka-tui.ts';
import type {PatkaUI} from './ui/patka-ui.ts';
import {toPatkaUtterance} from './ui/patka-user-input.ts';

export class Patka {
  private readonly patkaLogger = new PatkaLogger();
  private readonly patkaEngine: PatkaEngine;
  private readonly patkaUI: PatkaUI;

  constructor(patkaInferenceClientOption: PatkaInferenceClientOption) {
    this.patkaLogger.info({inference: patkaInferenceClientOption}, 'patka starts');

    const patkaTools = new PatkaTools([new ListFiles(), new ReadFile()]);

    this.patkaEngine = new PatkaEngine(
      new PatkaAgent('ROOT', buildInferenceClient(patkaInferenceClientOption), patkaTools),
    );
    this.patkaUI = new PatkaTUI(blessed);

    this.patkaUI.userInputs.subscribe((patkaUserInput) =>
      this.patkaEngine.handle(toPatkaUtterance(patkaUserInput)),
    );
    this.patkaEngine.patkaChatEntries.subscribe((patkaChatEntries) =>
      this.patkaUI.updateChat(patkaChatEntries),
    );
  }
}
