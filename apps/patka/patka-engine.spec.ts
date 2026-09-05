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

    it("holds every prompt that was sent", () => {
      const patkaAgent = new PatkaAgent({
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      });
      const engine = new PatkaEngine(patkaAgent);
      let chat: ReadonlyArray<PatkaChatEntry> = [];
      engine.chat.subscribe((content) => (chat = content));

      engine.send("hello");
      engine.send("again");

      expect(chat.map((entry) => entry.message.message)).toEqual(["hello", "again"]);
    });

    it("gives a late subscriber the chat so far", () => {
      const patkaAgent = new PatkaAgent({
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      });
      const engine = new PatkaEngine(patkaAgent);
      engine.send("hello");
      let chat: ReadonlyArray<PatkaChatEntry> = [];

      engine.chat.subscribe((content) => (chat = content));

      expect(chat.map((entry) => entry.message.message)).toEqual(["hello"]);
    });
  });
});
