import blessed from "blessed";
import { Ollama } from "ollama";
import { DefaultPatkaPromptFactory } from "./default-patka-prompt-factory.ts";
import { OllamaInferenceClient } from "./ollama-inference-client.ts";
import { PatkaAgent } from "./patka-agent.ts";
import { PatkaEngine } from "./patka-engine.ts";
import { PatkaTUI } from "./patka-tui.ts";
import type { PatkaUI } from "./patka-ui.ts";
import { toPatkaUtterance } from "./patka-user-input.ts";

const MODEL = "qwen2.5-coder:latest";

export class Patka {
  private readonly patkaEngine: PatkaEngine;
  private readonly patkaUI: PatkaUI;

  constructor() {
    this.patkaEngine = new PatkaEngine(
      new PatkaAgent(
        "patka",
        new OllamaInferenceClient(MODEL, new Ollama()),
        new DefaultPatkaPromptFactory(),
      ),
    );
    this.patkaUI = new PatkaTUI(blessed);

    this.patkaUI.userInputs.subscribe((userInput) =>
      this.patkaEngine.handle(toPatkaUtterance(userInput)),
    );
    this.patkaEngine.chat.subscribe((chat) => this.patkaUI.updateChat(chat));
  }
}
