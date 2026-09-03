import { describe, it, expect } from "vitest";
import { Observable } from "rxjs";
import { PatkaAgent } from "./patka-agent.ts";

describe("PatkaAgent", () => {
  it("exists", () => {
    expect(PatkaAgent).toBeDefined();
  });

  it("can be instantiated", () => {
    expect(new PatkaAgent()).toBeInstanceOf(PatkaAgent);
  });

  describe("send", () => {
    it("exists", () => {
      expect(new PatkaAgent().send).toBeTypeOf("function");
    });

    it("takes a single argument", () => {
      expect(new PatkaAgent().send.length).toBe(1);
    });

    it("returns nothing", () => {
      expect(new PatkaAgent().send("hello")).toBeUndefined();
    });
  });

  describe("responses", () => {
    it("is an Observable", () => {
      expect(new PatkaAgent().responses).toBeInstanceOf(Observable);
    });
  });
});
