import { randomUUID } from "node:crypto";
import { of, Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { PatkaAgent } from "./patka-agent.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";
import { PatkaEngine } from "./patka-engine.ts";
import type { PatkaMessage } from "./patka-message.ts";

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

  it("shows a pending response until the answer arrives", () => {
    const responses = new Subject<PatkaMessage>();
    const engine = new PatkaEngine(new PatkaAgent({ generate: () => responses }));
    let chat: ReadonlyArray<PatkaChatEntry> = [];
    engine.chat.subscribe((content) => (chat = content));

    engine.pushUserPrompt("hello");

    expect(chat.map((entry) => entry.message.message)).toEqual(["hello", "..."]);

    responses.next({ message: "world", id: randomUUID() });

    expect(chat.map((entry) => entry.message.message)).toEqual(["hello", "world"]);
  });

  it("answers every prompt in its own entry, even when they overlap", () => {
    const answers: Array<Subject<PatkaMessage>> = [];
    const engine = new PatkaEngine(
      new PatkaAgent({
        generate: () => {
          const answer = new Subject<PatkaMessage>();
          answers.push(answer);
          return answer;
        },
      }),
    );
    let chat: ReadonlyArray<PatkaChatEntry> = [];
    engine.chat.subscribe((content) => (chat = content));

    engine.pushUserPrompt("first");
    engine.pushUserPrompt("second");
    answers[0].next({ message: "answer one", id: randomUUID() });
    answers[0].complete();
    answers[1].next({ message: "answer two", id: randomUUID() });
    answers[1].complete();

    expect(chat.map((entry) => entry.message.message)).toEqual([
      "first",
      "answer one",
      "second",
      "answer two",
    ]);
  });
});
