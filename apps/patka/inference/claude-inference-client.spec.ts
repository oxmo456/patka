import { randomUUID } from "node:crypto";
import { firstValueFrom } from "rxjs";
import { describe, expect, it } from "vitest";
import { ClaudeInferenceClient } from "./claude-inference-client.ts";

describe("ClaudeInferenceClient", () => {
  it("emits what the command printed", async () => {
    const client = new ClaudeInferenceClient("echo");

    const response = await firstValueFrom(client.generate({ message: "hello", id: randomUUID() }));

    expect(response.message).toContain("hello");
  });

  it("gives the response its own id", async () => {
    const id = randomUUID();
    const client = new ClaudeInferenceClient("echo");

    const response = await firstValueFrom(client.generate({ message: "hello", id }));

    expect(response.id).not.toBe(id);
  });

  it("errors when the command cannot be run", async () => {
    const client = new ClaudeInferenceClient("this-command-does-not-exist");

    await expect(
      firstValueFrom(client.generate({ message: "hello", id: randomUUID() })),
    ).rejects.toThrow();
  });

  it("errors when the command fails", async () => {
    const client = new ClaudeInferenceClient("false");

    await expect(
      firstValueFrom(client.generate({ message: "hello", id: randomUUID() })),
    ).rejects.toThrow("exited with code 1");
  });
});
