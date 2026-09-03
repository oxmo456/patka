import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { firstValueFrom } from "rxjs";
import type { Ollama } from "ollama";
import { OllamaInferenceClient } from "./ollama-inference-client.ts";

describe("OllamaInferenceClient", () => {
  it("emits the generated content as a message", async () => {
    const ollama = {
      generate: vi.fn(async () => ({ response: "world" })),
    } as unknown as Ollama;
    const client = new OllamaInferenceClient("llama3", ollama);

    const response = await firstValueFrom(client.generate({ message: "hello", id: randomUUID() }));

    expect(response.message).toBe("world");
  });

  it("gives the generated message its own id", async () => {
    const ollama = {
      generate: vi.fn(async () => ({ response: "world" })),
    } as unknown as Ollama;
    const client = new OllamaInferenceClient("llama3", ollama);
    const id = randomUUID();

    const response = await firstValueFrom(client.generate({ message: "hello", id }));

    expect(response.id).not.toBe(id);
    expect(response.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("asks the configured model with the message as the prompt", async () => {
    const ollama = {
      generate: vi.fn(async () => ({ response: "world" })),
    } as unknown as Ollama;
    const client = new OllamaInferenceClient("llama3", ollama);

    await firstValueFrom(client.generate({ message: "hello", id: randomUUID() }));

    expect(ollama.generate).toHaveBeenCalledWith({
      model: "llama3",
      prompt: "hello",
    });
  });

  it("does not call Ollama until subscribed", () => {
    const ollama = {
      generate: vi.fn(async () => ({ response: "world" })),
    } as unknown as Ollama;
    const client = new OllamaInferenceClient("llama3", ollama);

    client.generate({ message: "hello", id: randomUUID() });

    expect(ollama.generate).not.toHaveBeenCalled();
  });
});
