import { Ollama } from "ollama";
import { OllamaInferenceClient } from "./ollama-inference-client.ts";
import { PatkaAgent } from "./patka-agent.ts";

const MODEL = "qwen2.5-coder:latest";

export class Patka {
  private readonly patkaAgent: PatkaAgent;

  constructor() {
    this.patkaAgent = new PatkaAgent(new OllamaInferenceClient(MODEL, new Ollama()));
  }
}
