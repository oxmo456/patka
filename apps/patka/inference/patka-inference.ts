import { Ollama } from "ollama";
import { match } from "ts-pattern";
import { ClaudeInferenceClient } from "./claude-inference-client.ts";
import type { InferenceClient } from "./inference-client.ts";
import { OllamaInferenceClient } from "./ollama-inference-client.ts";

const OLLAMA_MODEL = "qwen2.5-coder:latest";

const CLAUDE_COMMAND = "claude";

export type PatkaInferenceClientOption = "ollama" | "claude";

export const extractInferenceClientOption = (
  args: ReadonlyArray<string>,
): PatkaInferenceClientOption => (args.includes("--claude") ? "claude" : "ollama");

export const buildInferenceClient = (inference: PatkaInferenceClientOption): InferenceClient =>
  match(inference)
    .with("claude", () => new ClaudeInferenceClient(CLAUDE_COMMAND))
    .with("ollama", () => new OllamaInferenceClient(OLLAMA_MODEL, new Ollama()))
    .exhaustive();
