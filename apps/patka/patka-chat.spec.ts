import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PatkaChat } from "./patka-chat.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";

describe("PatkaChat", () => {
  describe("push", () => {
    it("returns the id of the message it added", () => {
      const patkaChat = new PatkaChat();
      let entries: ReadonlyArray<PatkaChatEntry> = [];
      patkaChat.entries.subscribe((content) => (entries = content));

      const id = patkaChat.push("hello");

      expect(entries.map((entry) => entry.message.id)).toEqual([id]);
    });

    it("returns a different id for every message", () => {
      const patkaChat = new PatkaChat();

      expect(patkaChat.push("hello")).not.toBe(patkaChat.push("world"));
    });
  });

  describe("update", () => {
    it("replaces the message with that id, keeping its place", () => {
      const patkaChat = new PatkaChat();
      let entries: ReadonlyArray<PatkaChatEntry> = [];
      patkaChat.entries.subscribe((content) => (entries = content));
      const id = patkaChat.push("...");
      patkaChat.push("later");

      patkaChat.update(id, "the answer");

      expect(entries.map((entry) => entry.message.message)).toEqual(["the answer", "later"]);
    });

    it("keeps the id of the message it updated", () => {
      const patkaChat = new PatkaChat();
      let entries: ReadonlyArray<PatkaChatEntry> = [];
      patkaChat.entries.subscribe((content) => (entries = content));
      const id = patkaChat.push("...");

      patkaChat.update(id, "the answer");

      expect(entries.map((entry) => entry.message.id)).toEqual([id]);
    });

    it("leaves the chat alone when the id is unknown", () => {
      const patkaChat = new PatkaChat();
      let entries: ReadonlyArray<PatkaChatEntry> = [];
      patkaChat.entries.subscribe((content) => (entries = content));
      patkaChat.push("hello");

      patkaChat.update(randomUUID(), "the answer");

      expect(entries.map((entry) => entry.message.message)).toEqual(["hello"]);
    });
  });

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

      patkaChat.push("hello");
      patkaChat.push("world");

      expect(entries.map((entry) => entry.message.message)).toEqual(["hello", "world"]);
    });

    it("emits again when a message is updated", () => {
      const patkaChat = new PatkaChat();
      const id = patkaChat.push("...");
      const received: Array<string> = [];
      patkaChat.entries.subscribe((entries) => received.push(entries[0].message.message));

      patkaChat.update(id, "the answer");

      expect(received).toEqual(["...", "the answer"]);
    });

    it("gives a late subscriber the entries so far", () => {
      const patkaChat = new PatkaChat();
      patkaChat.push("hello");
      let entries: ReadonlyArray<PatkaChatEntry> = [];

      patkaChat.entries.subscribe((content) => (entries = content));

      expect(entries.map((entry) => entry.message.message)).toEqual(["hello"]);
    });
  });
});
