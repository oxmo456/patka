import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { of } from "rxjs";
import { PatkaAgent } from "./patka-agent.ts";
import { PatkaEngine } from "./patka-engine.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

describe("PatkaEngine", () => {
  describe("chat", () => {
    it("starts empty", () => {
      const patkaAgent = new PatkaAgent({
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      });
      const engine = new PatkaEngine(patkaAgent);
      const received: Array<ReadonlyArray<PatkaChatEntry>> = [];

      engine.chat.subscribe((chat) => received.push(chat));

      expect(received).toEqual([[]]);
    });

    it("holds prompts and responses in the order they happened", () => {
      const patkaAgent = new PatkaAgent({
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      });
      const engine = new PatkaEngine(patkaAgent);
      let chat: ReadonlyArray<PatkaChatEntry> = [];
      engine.chat.subscribe((content) => (chat = content));

      engine.pushUserPrompt("hello");
      engine.pushUserPrompt("again");

      expect(chat.map((entry) => entry.message.message)).toEqual([
        "hello",
        "world",
        "again",
        "world",
      ]);
    });

    it("gives a late subscriber the chat so far", () => {
      const patkaAgent = new PatkaAgent({
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      });
      const engine = new PatkaEngine(patkaAgent);
      engine.pushUserPrompt("hello");
      let chat: ReadonlyArray<PatkaChatEntry> = [];

      engine.chat.subscribe((content) => (chat = content));

      expect(chat.map((entry) => entry.message.message)).toEqual(["hello", "world"]);
    });
  });

  it("sends the prompt to the inference client", () => {
    const generate = vi.fn(() => of({ message: "world", id: randomUUID() }));
    const engine = new PatkaEngine(new PatkaAgent({ generate }));

    engine.pushUserPrompt("hello");

    expect(generate).toHaveBeenCalledWith({ message: "hello", id: expect.any(String) });
  });

  it("adds the inference response to the chat", () => {
    const engine = new PatkaEngine(
      new PatkaAgent({ generate: vi.fn(() => of({ message: "world", id: randomUUID() })) }),
    );
    let chat: ReadonlyArray<PatkaChatEntry> = [];
    engine.chat.subscribe((content) => (chat = content));

    engine.pushUserPrompt("hello");

    expect(chat.map((entry) => entry.message.message)).toEqual(["hello", "world"]);
  });
});
