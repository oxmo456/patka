import {
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextRenderable,
  createCliRenderer,
  green,
  red,
  t,
  yellow,
} from "@opentui/core";

import { install, log, type Level } from "./logs.ts";
import { Ollama } from "./ollama.ts";
import { RequestService } from "./service.ts";

const PENDING = "...";
const BORDER = "#4a4a4a";
const LEVEL_COLOR = { info: green, warn: yellow, error: red } as const;

const renderer = await createCliRenderer({ exitOnCtrlC: true });

const left = new BoxRenderable(renderer, { width: "50%", flexDirection: "column" });
const chat = new ScrollBoxRenderable(renderer, {
  title: "Chat",
  border: true,
  borderStyle: "rounded",
  borderColor: BORDER,
  flexGrow: 1,
  stickyScroll: true,
  stickyStart: "bottom",
});
const inputBox = new BoxRenderable(renderer, {
  title: "Input (Enter to send, Esc/Ctrl+C to quit)",
  border: true,
  borderStyle: "rounded",
  borderColor: BORDER,
  height: 3,
});
const input = new InputRenderable(renderer, {});
inputBox.add(input);
const logs = new ScrollBoxRenderable(renderer, {
  title: "Agent logs",
  border: true,
  borderStyle: "rounded",
  borderColor: BORDER,
  width: "50%",
  stickyScroll: true,
  stickyStart: "bottom",
});
left.add(chat);
left.add(inputBox);
renderer.root.add(left);
renderer.root.add(logs);
renderer.root.flexDirection = "row";

install((level: Level, message: string) => {
  const color = LEVEL_COLOR[level];
  logs.add(
    new TextRenderable(renderer, { content: t`${color(level.toUpperCase().padEnd(5))} ${message}` }),
  );
});

const service = new RequestService();
const ollama = new Ollama();

service.subscribe((event) => log.info(`request ${event.request.id.slice(0, 8)} ${event.kind}`));

function say(content: string): TextRenderable {
  const line = new TextRenderable(renderer, { content });
  chat.add(line);
  return line;
}

input.on(InputRenderableEvents.ENTER, (value: string) => {
  input.value = "";
  if (!value) return;

  log.info(`message submitted (${value.length} chars)`);
  const request = service.createRequest(value);
  say(`you: ${value}`);
  const pending = say(PENDING);

  ollama.send(value).then(
    (reply) => {
      log.info(`reply received (${reply.length} chars)`);
      service.completeRequest(request.id);
      pending.content = `qwen: ${reply}`;
    },
    (err: Error) => {
      log.error(err.message);
      service.cancelRequest(request.id);
      pending.content = `qwen: <${err.message}>`;
    },
  );
});

renderer.keyInput.on("keypress", (key) => {
  if (key.name === "escape") {
    renderer.destroy();
    process.exit(0);
  }
});

log.info("patka starting");
input.focus();
renderer.start();
