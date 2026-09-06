import { randomUUID } from "node:crypto";
import type Anthropic from "@anthropic-ai/sdk";
import { firstValueFrom } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { AnthropicInferenceClient } from "./anthropic-inference-client.ts";

const anAnthropic = (create: () => unknown): Anthropic =>
  ({ messages: { create } }) as unknown as Anthropic;

describe("AnthropicInferenceClient", () => {
  it("emits the text the model answered", async () => {
    const anthropic = anAnthropic(async () => ({
      content: [{ type: "text", text: "world" }],
    }));
    const client = new AnthropicInferenceClient("claude-opus-5", anthropic);

    const response = await firstValueFrom(client.generate({ message: "hello", id: randomUUID() }));

    expect(response.message).toBe("world");
  });

  it("joins every text block the model answered", async () => {
    const anthropic = anAnthropic(async () => ({
      content: [
        { type: "thinking", thinking: "" },
        { type: "text", text: "hello " },
        { type: "text", text: "world" },
      ],
    }));
    const client = new AnthropicInferenceClient("claude-opus-5", anthropic);

    const response = await firstValueFrom(client.generate({ message: "hello", id: randomUUID() }));

    expect(response.message).toBe("hello world");
  });

  it("asks the configured model with the message as the prompt", async () => {
    const create = vi.fn(async () => ({ content: [{ type: "text", text: "world" }] }));
    const client = new AnthropicInferenceClient("claude-opus-5", anAnthropic(create));

    await firstValueFrom(client.generate({ message: "hello", id: randomUUID() }));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-opus-5",
        messages: [{ role: "user", content: "hello" }],
      }),
    );
  });

  it("does not call the api until subscribed", () => {
    const create = vi.fn(async () => ({ content: [{ type: "text", text: "world" }] }));
    const client = new AnthropicInferenceClient("claude-opus-5", anAnthropic(create));

    client.generate({ message: "hello", id: randomUUID() });

    expect(create).not.toHaveBeenCalled();
  });
});
