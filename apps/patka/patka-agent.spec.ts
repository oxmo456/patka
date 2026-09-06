import { randomUUID } from "node:crypto";
import { of, Subject, throwError } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import type { InferenceClient } from "./inference-client.ts";
import { PatkaAgent } from "./patka-agent.ts";
import type { PatkaMessage } from "./patka-message.ts";
import type { PatkaPrompt } from "./patka-prompt.ts";
import type { PatkaTurn } from "./patka-turn.ts";

const aPrompt = (content: string): PatkaPrompt => ({
  content,
  timestamp: new Date(),
  id: randomUUID(),
});

describe("PatkaAgent", () => {
  it("has a name", () => {
    const inferenceClient: InferenceClient = {
      generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
    };

    expect(new PatkaAgent("patka", inferenceClient).name).toBe("patka");
  });

  describe("ask", () => {
    it("generates from the prompt content", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      const agent = new PatkaAgent("patka", inferenceClient);
      agent.turns.subscribe();

      agent.ask(aPrompt("hello"));

      expect(inferenceClient.generate).toHaveBeenCalledWith({
        message: "hello",
        id: expect.any(String),
      });
    });

    it("opens a pending turn before the answer arrives", () => {
      const answers = new Subject<PatkaMessage>();
      const agent = new PatkaAgent("patka", { generate: () => answers });
      const turns: Array<PatkaTurn> = [];
      agent.turns.subscribe((turn) => turns.push(turn));

      agent.ask(aPrompt("hello"));

      expect(turns.map((turn) => turn.status)).toEqual(["pending"]);
      expect(turns[0].response).toBeUndefined();
    });

    it("answers the turn it opened, keeping its id", () => {
      const agent = new PatkaAgent("patka", {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      });
      const turns: Array<PatkaTurn> = [];
      agent.turns.subscribe((turn) => turns.push(turn));

      agent.ask(aPrompt("hello"));

      expect(turns.map((turn) => turn.status)).toEqual(["pending", "answered"]);
      expect(turns[1].id).toBe(turns[0].id);
      expect(turns[1].response).toBe("world");
    });

    it("keeps the prompt on the turn", () => {
      const agent = new PatkaAgent("patka", {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      });
      const prompt = aPrompt("hello");
      const turns: Array<PatkaTurn> = [];
      agent.turns.subscribe((turn) => turns.push(turn));

      agent.ask(prompt);

      expect(turns.map((turn) => turn.prompt)).toEqual([prompt, prompt]);
    });

    it("fails the turn when the inference client errors", () => {
      const agent = new PatkaAgent("patka", {
        generate: () => throwError(() => new Error("ollama is down")),
      });
      const turns: Array<PatkaTurn> = [];
      agent.turns.subscribe((turn) => turns.push(turn));

      agent.ask(aPrompt("hello"));

      expect(turns.map((turn) => turn.status)).toEqual(["pending", "failed"]);
    });

    it("does not generate anything on its own", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      new PatkaAgent("patka", inferenceClient);

      expect(inferenceClient.generate).not.toHaveBeenCalled();
    });
  });
});
