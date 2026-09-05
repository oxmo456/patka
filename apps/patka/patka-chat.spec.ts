import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { PatkaChat } from "./patka-chat.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

describe("PatkaChat", () => {
  it("starts empty", () => {
    expect(new PatkaChat().entries).toEqual([]);
  });

  it("holds every message that was pushed, in order", () => {
    const patkaChat = new PatkaChat();

    patkaChat.push({ message: "hello", id: randomUUID() });
    patkaChat.push({ message: "world", id: randomUUID() });

    expect(patkaChat.entries.map((entry) => entry.message.message)).toEqual(["hello", "world"]);
  });

  it("keeps the entries it already held when a new one is pushed", () => {
    const patkaChat = new PatkaChat();
    patkaChat.push({ message: "hello", id: randomUUID() });
    const before = patkaChat.entries;

    patkaChat.push({ message: "world", id: randomUUID() });

    expect(before.map((entry) => entry.message.message)).toEqual(["hello"]);
  });

  describe("changes", () => {
    it("emits the entries every time one is pushed", () => {
      const patkaChat = new PatkaChat();
      const received: Array<ReadonlyArray<PatkaChatEntry>> = [];
      patkaChat.changes.subscribe((entries) => received.push(entries));

      patkaChat.push({ message: "hello", id: randomUUID() });

      expect(received.map((entries) => entries.length)).toEqual([0, 1]);
    });

    it("gives a late subscriber the entries so far", () => {
      const patkaChat = new PatkaChat();
      patkaChat.push({ message: "hello", id: randomUUID() });
      let entries: ReadonlyArray<PatkaChatEntry> = [];

      patkaChat.changes.subscribe((content) => (entries = content));

      expect(entries.map((entry) => entry.message.message)).toEqual(["hello"]);
    });
  });
});
