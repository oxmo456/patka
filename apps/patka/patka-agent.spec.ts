import { randomUUID } from "node:crypto";
import { of, Subject, throwError } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import type { InferenceClient } from "./inference-client.ts";
import { none, some } from "./option.ts";
import { PatkaAgent } from "./patka-agent.ts";
import type { PatkaExchange } from "./patka-exchange.ts";
import type { PatkaMessage } from "./patka-message.ts";
import type { PatkaUtterance } from "./patka-utterance.ts";

const anUtterance = (content: string): PatkaUtterance => ({
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
    it("generates from the utterance content", () => {
      const inferenceClient: InferenceClient = {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      };
      const agent = new PatkaAgent("patka", inferenceClient);
      agent.exchanges.subscribe();

      agent.handle(anUtterance("hello"));

      expect(inferenceClient.generate).toHaveBeenCalledWith({
        message: "hello",
        id: expect.any(String),
      });
    });

    it("opens a pending exchange before the answer arrives", () => {
      const answers = new Subject<PatkaMessage>();
      const agent = new PatkaAgent("patka", { generate: () => answers });
      const exchanges: Array<PatkaExchange> = [];
      agent.exchanges.subscribe((exchange) => exchanges.push(exchange));

      agent.handle(anUtterance("hello"));

      expect(exchanges.map((exchange) => exchange.status)).toEqual(["pending"]);
      expect(exchanges[0].response).toEqual(none);
    });

    it("answers the exchange it opened, keeping its id", () => {
      const agent = new PatkaAgent("patka", {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      });
      const exchanges: Array<PatkaExchange> = [];
      agent.exchanges.subscribe((exchange) => exchanges.push(exchange));

      agent.handle(anUtterance("hello"));

      expect(exchanges.map((exchange) => exchange.status)).toEqual(["pending", "answered"]);
      expect(exchanges[1].id).toBe(exchanges[0].id);
      expect(exchanges[1].response).toEqual(
        some({ content: "world", timestamp: expect.any(Date), id: expect.any(String) }),
      );
    });

    it("keeps the utterance on the exchange", () => {
      const agent = new PatkaAgent("patka", {
        generate: vi.fn(() => of({ message: "world", id: randomUUID() })),
      });
      const utterance = anUtterance("hello");
      const exchanges: Array<PatkaExchange> = [];
      agent.exchanges.subscribe((exchange) => exchanges.push(exchange));

      agent.handle(utterance);

      expect(exchanges.map((exchange) => exchange.utterance)).toEqual([utterance, utterance]);
    });

    it("fails the exchange when the inference client errors", () => {
      const agent = new PatkaAgent("patka", {
        generate: () => throwError(() => new Error("ollama is down")),
      });
      const exchanges: Array<PatkaExchange> = [];
      agent.exchanges.subscribe((exchange) => exchanges.push(exchange));

      agent.handle(anUtterance("hello"));

      expect(exchanges.map((exchange) => exchange.status)).toEqual(["pending", "failed"]);
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
