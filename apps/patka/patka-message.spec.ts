import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { PatkaMessage } from "./patka-message.ts";

describe("PatkaMessage", () => {
  it("holds a message and a uuid", () => {
    const patkaMessage: PatkaMessage = { message: "hello", id: randomUUID() };

    expect(patkaMessage.message).toBe("hello");
    expect(patkaMessage.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
