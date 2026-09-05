import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { Observable, of } from "rxjs";
import type { InferenceClient } from "./inference-client.ts";
import type { PatkaMessage } from "./patka-message.ts";
import { PatkaAgent } from "./patka-agent.ts";

describe("PatkaAgent", () => {
  it("exists", () => {
    expect(PatkaAgent).toBeDefined();
  });


  describe("send", () => {
    it("returns nothing", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      const agent = new PatkaAgent(inferenceClient);

      expect(agent.send("hello")).toBeUndefined();
    });

    it("generates from the sent message", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      const agent = new PatkaAgent(inferenceClient);
      agent.responses.subscribe();

      agent.send("hello");

      expect(inferenceClient.generate).toHaveBeenCalledWith({
        message: "hello",
        id: expect.any(String),
      });
    });

    it("does not generate anything on its own", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      const agent = new PatkaAgent(inferenceClient);

      agent.responses.subscribe();

      expect(inferenceClient.generate).not.toHaveBeenCalled();
    });
  });

  describe("responses", () => {
    it("is an Observable", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };

      expect(new PatkaAgent(inferenceClient).responses).toBeInstanceOf(Observable);
    });

    it("emits what the inference client generated", () => {
      const answer: PatkaMessage = { message: "world", id: randomUUID() };
      const inferenceClient: InferenceClient = { generate: vi.fn(() => of(answer)) };
      const agent = new PatkaAgent(inferenceClient);
      const received: PatkaMessage[] = [];
      agent.responses.subscribe((response) => received.push(response));

      agent.send("hello");

      expect(received).toEqual([answer]);
    });

    it("emits nothing before a message is sent", () => {
      const answer: PatkaMessage = { message: "world", id: randomUUID() };
      const inferenceClient: InferenceClient = { generate: vi.fn(() => of(answer)) };
      const agent = new PatkaAgent(inferenceClient);
      const received: PatkaMessage[] = [];

      agent.responses.subscribe((response) => received.push(response));

      expect(received).toEqual([]);
    });

    it("drops messages sent while nothing is subscribed", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      const agent = new PatkaAgent(inferenceClient);

      agent.send("hello");

      expect(inferenceClient.generate).not.toHaveBeenCalled();
    });

    it("generates once per subscriber", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      const agent = new PatkaAgent(inferenceClient);
      agent.responses.subscribe();
      agent.responses.subscribe();

      agent.send("hello");

      expect(inferenceClient.generate).toHaveBeenCalledTimes(2);
    });
  });
});
