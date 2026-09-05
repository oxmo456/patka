import blessed from "blessed";
import { Ollama } from "ollama";
import { OllamaInferenceClient } from "./ollama-inference-client.ts";
import { PatkaAgent } from "./patka-agent.ts";
import { PatkaCLI } from "./patka-cli.ts";
import type { PatkaUI } from "./patka-ui.ts";

const MODEL = "qwen2.5-coder:latest";

export class Patka {
  private readonly patkaAgent: PatkaAgent;
  private readonly patkaUI: PatkaUI;

  constructor() {
    this.patkaAgent = new PatkaAgent(new OllamaInferenceClient(MODEL, new Ollama()));
    this.patkaUI = new PatkaCLI(blessed);
  }
}
