import blessed from "blessed";
import { Ollama } from "ollama";
import { OllamaInferenceClient } from "./ollama-inference-client.ts";
import { PatkaAgent } from "./patka-agent.ts";
import { PatkaCLI } from "./patka-cli.ts";
import { PatkaEngine } from "./patka-engine.ts";
import type { PatkaUI } from "./patka-ui.ts";

const MODEL = "qwen2.5-coder:latest";

export class Patka {
  private readonly patkaEngine: PatkaEngine;
  private readonly patkaUI: PatkaUI;

  constructor() {
    this.patkaEngine = new PatkaEngine(
      new PatkaAgent(new OllamaInferenceClient(MODEL, new Ollama())),
    );
    this.patkaUI = new PatkaCLI(blessed);

    this.patkaUI.prompts.subscribe((prompt) => this.patkaEngine.pushUserPrompt(prompt));
    this.patkaEngine.chat.subscribe((chat) => this.patkaUI.updateChat(chat));
  }
}
