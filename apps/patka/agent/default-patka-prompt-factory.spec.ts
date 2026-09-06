import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { none, some } from "../option.ts";
import type { PatkaRole } from "../patka-role.ts";
import { DefaultPatkaPromptFactory } from "./default-patka-prompt-factory.ts";
import type { PatkaConversationEntry } from "./patka-conversation.ts";

const spoken = (role: PatkaRole, content: string): PatkaConversationEntry => ({
  id: randomUUID(),
  role,
  utterance: some({ content, timestamp: new Date(), id: randomUUID() }),
});

const pending = (role: PatkaRole): PatkaConversationEntry => ({
  id: randomUUID(),
  role,
  utterance: none,
});

describe("DefaultPatkaPromptFactory", () => {
  it("tells the model to keep its answer short", () => {
    expect(new DefaultPatkaPromptFactory().create([])).toContain("fewest words possible");
  });

  it("asks for an answer when nothing has been said", () => {
    expect(new DefaultPatkaPromptFactory().create([]).endsWith("\n\nAssistant:")).toBe(true);
  });

  it("labels who said what", () => {
    const history = [spoken("user", "hello"), spoken("agent", "hi there")];

    expect(new DefaultPatkaPromptFactory().create(history)).toContain(
      ["User: hello", "Assistant: hi there", "Assistant:"].join("\n"),
    );
  });

  it("leaves out the nodes nobody has filled yet", () => {
    const history = [spoken("user", "hello"), pending("agent")];

    expect(new DefaultPatkaPromptFactory().create(history)).toContain(
      ["User: hello", "Assistant:"].join("\n"),
    );
  });

  it("keeps the whole conversation, in order", () => {
    const history = [
      spoken("user", "my name is Zaphod"),
      spoken("agent", "nice to meet you"),
      spoken("user", "what is my name?"),
      pending("agent"),
    ];

    expect(new DefaultPatkaPromptFactory().create(history)).toContain(
      [
        "User: my name is Zaphod",
        "Assistant: nice to meet you",
        "User: what is my name?",
        "Assistant:",
      ].join("\n"),
    );
  });
});
