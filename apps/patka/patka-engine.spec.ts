import { randomUUID } from "node:crypto";
import { of, Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { DefaultPatkaPromptFactory } from "./default-patka-prompt-factory.ts";
import { PatkaAgent } from "./patka-agent.ts";
import type { PatkaChatEntry } from "./patka-chat-entry.ts";
import { PatkaEngine } from "./patka-engine.ts";
import type { PatkaMessage } from "./patka-message.ts";
import type { PatkaUtterance } from "./patka-utterance.ts";

const anUtterance = (content: string): PatkaUtterance => ({
  content,
  timestamp: new Date(),
  id: randomUUID(),
});

describe("PatkaEngine", () => {
  describe("chat", () => {
    it("starts empty", () => {
      const engine = new PatkaEngine(
        new PatkaAgent(
          "patka",
          {
            generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
          },
          new DefaultPatkaPromptFactory(),
        ),
      );
      const received: Array<ReadonlyArray<PatkaChatEntry>> = [];

      engine.chat.subscribe((chat) => received.push(chat));

      expect(received).toEqual([[]]);
    });

    it("holds the utterance and the answer, in the order they happened", () => {
      const engine = new PatkaEngine(
        new PatkaAgent(
          "patka",
          {
            generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
          },
          new DefaultPatkaPromptFactory(),
        ),
      );
      let chat: ReadonlyArray<PatkaChatEntry> = [];
      engine.chat.subscribe((content) => {
        chat = content;
      });

      engine.handle(anUtterance("hello"));

      expect(chat.map((entry) => entry.message)).toEqual(["hello", "world"]);
    });

    it("names the author and role of every entry", () => {
      const engine = new PatkaEngine(
        new PatkaAgent(
          "patka",
          {
            generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
          },
          new DefaultPatkaPromptFactory(),
        ),
      );
      let chat: ReadonlyArray<PatkaChatEntry> = [];
      engine.chat.subscribe((content) => {
        chat = content;
      });

      engine.handle(anUtterance("hello"));

      expect(chat.map((entry) => entry.author)).toEqual(["you", "patka"]);
      expect(chat.map((entry) => entry.role)).toEqual(["user", "agent"]);
    });

    it("keeps the answer pending until it arrives", () => {
      const answers = new Subject<PatkaMessage>();
      const engine = new PatkaEngine(
        new PatkaAgent("patka", { generate: () => answers }, new DefaultPatkaPromptFactory()),
      );
      let chat: ReadonlyArray<PatkaChatEntry> = [];
      engine.chat.subscribe((content) => {
        chat = content;
      });

      engine.handle(anUtterance("hello"));

      expect(chat.map((entry) => entry.status)).toEqual(["complete", "pending"]);

      answers.next({ message: "world", id: randomUUID() });

      expect(chat.map((entry) => entry.status)).toEqual(["complete", "complete"]);
      expect(chat.map((entry) => entry.message)).toEqual(["hello", "world"]);
    });

    it("gives every utterance its own answer, even when they overlap", () => {
      const answers: Array<Subject<PatkaMessage>> = [];
      const engine = new PatkaEngine(
        new PatkaAgent(
          "patka",
          {
            generate: () => {
              const answer = new Subject<PatkaMessage>();
              answers.push(answer);
              return answer;
            },
          },
          new DefaultPatkaPromptFactory(),
        ),
      );
      let chat: ReadonlyArray<PatkaChatEntry> = [];
      engine.chat.subscribe((content) => {
        chat = content;
      });

      engine.handle(anUtterance("first"));
      engine.handle(anUtterance("second"));
      answers[0].next({ message: "answer one", id: randomUUID() });
      answers[1].next({ message: "answer two", id: randomUUID() });

      expect(chat.map((entry) => entry.message)).toEqual([
        "first",
        "answer one",
        "second",
        "answer two",
      ]);
    });
  });
});
