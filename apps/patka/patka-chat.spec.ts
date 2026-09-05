import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { PatkaChat } from "./patka-chat.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

describe("PatkaChat", () => {
  describe("entries", () => {
    it("starts empty", () => {
      const patkaChat = new PatkaChat();
      const received: Array<ReadonlyArray<PatkaChatEntry>> = [];

      patkaChat.entries.subscribe((entries) => received.push(entries));

      expect(received).toEqual([[]]);
    });

    it("holds every message that was pushed, in order", () => {
      const patkaChat = new PatkaChat();
      let entries: ReadonlyArray<PatkaChatEntry> = [];
      patkaChat.entries.subscribe((content) => (entries = content));

      patkaChat.push({ message: "hello", id: randomUUID() });
      patkaChat.push({ message: "world", id: randomUUID() });

      expect(entries.map((entry) => entry.message.message)).toEqual(["hello", "world"]);
    });

    it("emits every time a message is pushed", () => {
      const patkaChat = new PatkaChat();
      const received: Array<ReadonlyArray<PatkaChatEntry>> = [];
      patkaChat.entries.subscribe((entries) => received.push(entries));

      patkaChat.push({ message: "hello", id: randomUUID() });

      expect(received.map((entries) => entries.length)).toEqual([0, 1]);
    });

    it("gives a late subscriber the entries so far", () => {
      const patkaChat = new PatkaChat();
      patkaChat.push({ message: "hello", id: randomUUID() });
      let entries: ReadonlyArray<PatkaChatEntry> = [];

      patkaChat.entries.subscribe((content) => (entries = content));

      expect(entries.map((entry) => entry.message.message)).toEqual(["hello"]);
    });
  });
});
