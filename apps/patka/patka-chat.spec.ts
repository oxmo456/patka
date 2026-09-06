import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PatkaChat } from "./patka-chat.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

const anEntry = (message: string, id = randomUUID()): PatkaChatEntry => ({
  id,
  author: "you",
  message,
  status: "complete",
});

describe("PatkaChat", () => {
  describe("push", () => {
    it("appends an entry the chat does not know yet", () => {
      const patkaChat = new PatkaChat();
      let entries: ReadonlyArray<PatkaChatEntry> = [];
      patkaChat.entries.subscribe((content) => {
        entries = content;
      });

      patkaChat.push(anEntry("hello"));
      patkaChat.push(anEntry("world"));

      expect(entries.map((entry) => entry.message)).toEqual(["hello", "world"]);
    });

    it("replaces the entry that already has that id, keeping its place", () => {
      const patkaChat = new PatkaChat();
      const id = randomUUID();
      let entries: ReadonlyArray<PatkaChatEntry> = [];
      patkaChat.entries.subscribe((content) => {
        entries = content;
      });
      patkaChat.push({ id, author: "patka", message: "", status: "pending" });
      patkaChat.push(anEntry("later"));

      patkaChat.push({ id, author: "patka", message: "the answer", status: "complete" });

      expect(entries.map((entry) => entry.message)).toEqual(["the answer", "later"]);
      expect(entries.map((entry) => entry.status)).toEqual(["complete", "complete"]);
    });
  });

  describe("entries", () => {
    it("starts empty", () => {
      const patkaChat = new PatkaChat();
      const received: Array<ReadonlyArray<PatkaChatEntry>> = [];

      patkaChat.entries.subscribe((entries) => received.push(entries));

      expect(received).toEqual([[]]);
    });

    it("emits again when an entry is replaced", () => {
      const patkaChat = new PatkaChat();
      const id = randomUUID();
      patkaChat.push({ id, author: "patka", message: "", status: "pending" });
      const received: Array<string> = [];
      patkaChat.entries.subscribe((entries) => received.push(entries[0].status));

      patkaChat.push({ id, author: "patka", message: "the answer", status: "complete" });

      expect(received).toEqual(["pending", "complete"]);
    });

    it("gives a late subscriber the entries so far", () => {
      const patkaChat = new PatkaChat();
      patkaChat.push(anEntry("hello"));
      let entries: ReadonlyArray<PatkaChatEntry> = [];

      patkaChat.entries.subscribe((content) => {
        entries = content;
      });

      expect(entries.map((entry) => entry.message)).toEqual(["hello"]);
    });
  });
});
