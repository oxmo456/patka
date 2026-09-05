import { randomUUID } from "node:crypto";
import { Observable, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import type { InferenceClient } from "./inference-client.ts";
import { PatkaAgent } from "./patka-agent.ts";
import type { PatkaMessage } from "./patka-message.ts";

describe("PatkaAgent", () => {
  it("exists", () => {
    expect(PatkaAgent).toBeDefined();
  });

  describe("send", () => {
    it("returns an Observable", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      const agent = new PatkaAgent(inferenceClient);

      expect(agent.send({ message: "hello", id: randomUUID() })).toBeInstanceOf(Observable);
    });

    it("generates from the sent message", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      const agent = new PatkaAgent(inferenceClient);
      const prompt = { message: "hello", id: randomUUID() };

      agent.send(prompt).subscribe();

      expect(inferenceClient.generate).toHaveBeenCalledWith(prompt);
    });

    it("emits what the inference client generated", () => {
      const answer: PatkaMessage = { message: "world", id: randomUUID() };
      const inferenceClient: InferenceClient = { generate: vi.fn(() => of(answer)) };
      const agent = new PatkaAgent(inferenceClient);
      const received: Array<PatkaMessage> = [];

      agent.send({ message: "hello", id: randomUUID() }).subscribe((response) => {
        received.push(response);
      });

      expect(received).toEqual([answer]);
    });
  });
});
