import { randomUUID } from "node:crypto";
import { of, Subject, throwError } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { DefaultPatkaPromptFactory } from "./default-patka-prompt-factory.ts";
import type { InferenceClient } from "./inference-client.ts";
import { isSome } from "./option.ts";
import { PatkaAgent } from "./patka-agent.ts";
import type { PatkaHistoryNode } from "./patka-history-node.ts";
import type { PatkaMessage } from "./patka-message.ts";
import type { PatkaUtterance } from "./patka-utterance.ts";

const anUtterance = (content: string): PatkaUtterance => ({
  content,
  timestamp: new Date(),
  id: randomUUID(),
});

const spoken = (history: ReadonlyArray<PatkaHistoryNode>): ReadonlyArray<string> =>
  history.map((node) => (isSome(node.utterance) ? node.utterance.value.content : "<pending>"));

describe("PatkaAgent", () => {
  it("has a name", () => {
    const inferenceClient: InferenceClient = {
      generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
    };

    expect(new PatkaAgent("patka", inferenceClient, new DefaultPatkaPromptFactory()).name).toBe(
      "patka",
    );
  });

  describe("history", () => {
    it("starts empty", () => {
      const agent = new PatkaAgent(
        "patka",
        { generate: vi.fn(() => of({ message: "world", id: randomUUID() })) },
        new DefaultPatkaPromptFactory(),
      );
      const received: Array<ReadonlyArray<PatkaHistoryNode>> = [];

      agent.history.subscribe((history) => received.push(history));

      expect(received).toEqual([[]]);
    });

    it("opens an empty node for the answer before it arrives", () => {
      const answers = new Subject<PatkaMessage>();
      const agent = new PatkaAgent(
        "patka",
        { generate: () => answers },
        new DefaultPatkaPromptFactory(),
      );
      let history: ReadonlyArray<PatkaHistoryNode> = [];
      agent.history.subscribe((content) => {
        history = content;
      });

      agent.handle(anUtterance("hello"));

      expect(spoken(history)).toEqual(["hello", "<pending>"]);
      expect(history.map((node) => node.role)).toEqual(["user", "agent"]);
    });

    it("fills the node it opened, keeping its place and id", () => {
      const answers = new Subject<PatkaMessage>();
      const agent = new PatkaAgent(
        "patka",
        { generate: () => answers },
        new DefaultPatkaPromptFactory(),
      );
      let history: ReadonlyArray<PatkaHistoryNode> = [];
      agent.history.subscribe((content) => {
        history = content;
      });
      agent.handle(anUtterance("hello"));
      const ids = history.map((node) => node.id);

      answers.next({ message: "world", id: randomUUID() });

      expect(spoken(history)).toEqual(["hello", "world"]);
      expect(history.map((node) => node.id)).toEqual(ids);
    });

    it("keeps the whole history across several utterances", () => {
      const agent = new PatkaAgent(
        "patka",
        { generate: vi.fn(() => of({ message: "world", id: randomUUID() })) },
        new DefaultPatkaPromptFactory(),
      );
      let history: ReadonlyArray<PatkaHistoryNode> = [];
      agent.history.subscribe((content) => {
        history = content;
      });

      agent.handle(anUtterance("first"));
      agent.handle(anUtterance("second"));

      expect(spoken(history)).toEqual(["first", "world", "second", "world"]);
    });

    it("leaves the node empty when the inference client fails", () => {
      const agent = new PatkaAgent(
        "patka",
        {
          generate: () => throwError(() => new Error("ollama is down")),
        },
        new DefaultPatkaPromptFactory(),
      );
      let history: ReadonlyArray<PatkaHistoryNode> = [];
      agent.history.subscribe((content) => {
        history = content;
      });

      agent.handle(anUtterance("hello"));

      expect(spoken(history)).toEqual(["hello", "<pending>"]);
    });

    it("generates from the whole conversation so far", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      const agent = new PatkaAgent("patka", inferenceClient, new DefaultPatkaPromptFactory());

      agent.handle(anUtterance("hello"));

      expect(inferenceClient.generate).toHaveBeenCalledWith({
        message: ["User: hello", "Assistant:"].join("\n"),
        id: expect.any(String),
      });
    });

    it("does not generate anything on its own", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      new PatkaAgent("patka", inferenceClient, new DefaultPatkaPromptFactory());

      expect(inferenceClient.generate).not.toHaveBeenCalled();
    });
  });
});
