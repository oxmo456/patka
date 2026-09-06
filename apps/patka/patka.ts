import blessed from "blessed";
import { DefaultPatkaPromptFactory } from "./default-patka-prompt-factory.ts";
import { PatkaAgent } from "./patka-agent.ts";
import { PatkaEngine } from "./patka-engine.ts";
import { buildInferenceClient, type PatkaInferenceClientOption } from "./patka-inference.ts";
import { PatkaTUI } from "./patka-tui.ts";
import type { PatkaUI } from "./patka-ui.ts";
import { toPatkaUtterance } from "./patka-user-input.ts";

export class Patka {
  private readonly patkaEngine: PatkaEngine;
  private readonly patkaUI: PatkaUI;

  constructor(inference: PatkaInferenceClientOption) {
    this.patkaEngine = new PatkaEngine(
      new PatkaAgent("patka", buildInferenceClient(inference), new DefaultPatkaPromptFactory()),
    );
    this.patkaUI = new PatkaTUI(blessed);

    this.patkaUI.userInputs.subscribe((userInput) =>
      this.patkaEngine.handle(toPatkaUtterance(userInput)),
    );
    this.patkaEngine.chat.subscribe((chat) => this.patkaUI.updateChat(chat));
  }
}
