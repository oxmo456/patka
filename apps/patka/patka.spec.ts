import { describe, it, expect } from "vitest";
import { Patka } from "./patka.ts";

describe("Patka", () => {
  it("exists", () => {
    expect(Patka).toBeDefined();
  });

  it("can be instantiated", () => {
    expect(new Patka()).toBeInstanceOf(Patka);
  });
});
