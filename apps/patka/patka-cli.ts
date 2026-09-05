import type blessedModule from "blessed";
import type { PatkaUI } from "./patka-ui.ts";

export type Blessed = Pick<typeof blessedModule, "screen" | "box">;

export class PatkaCLI implements PatkaUI {
  constructor(blessed: Blessed) {
    const screen = blessed.screen({ smartCSR: true, title: "patka" });

    screen.append(
      blessed.box({ top: 0, left: 0, width: "100%", height: "100%", content: "hello world" }),
    );
    screen.key(["escape", "q", "C-c"], () => process.exit(0));
    screen.render();
  }
}
