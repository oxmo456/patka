import { describe, expect, it } from "vitest";
import { extractInferenceClientOption } from "./patka-inference.ts";

describe("extractInferenceClientOption", () => {
  it("uses ollama when nothing is asked for", () => {
    expect(extractInferenceClientOption(["node", "main.js"])).toBe("ollama");
  });

  it("uses claude when --claude is passed", () => {
    expect(extractInferenceClientOption(["node", "main.js", "--claude"])).toBe("claude");
  });

  it("uses anthropic when --anthropic is passed", () => {
    expect(extractInferenceClientOption(["node", "main.js", "--anthropic"])).toBe("anthropic");
  });
});
