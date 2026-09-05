import { describe, it, expect, vi } from "vitest";
import type { Widgets } from "blessed";
import { PatkaCLI, type Blessed } from "./patka-cli.ts";

describe("PatkaCLI", () => {

  it("renders a box saying hello world", () => {
    const screen = {
      append: vi.fn(),
      key: vi.fn(),
      render: vi.fn(),
    } as unknown as Widgets.Screen;
    const box = {} as Widgets.BoxElement;
    const blessed = {
      screen: vi.fn(() => screen),
      box: vi.fn(() => box),
    } as unknown as Blessed;

    new PatkaCLI(blessed);

    expect(blessed.box).toHaveBeenCalledWith(expect.objectContaining({ content: "hello world" }));
    expect(screen.append).toHaveBeenCalledWith(box);
    expect(screen.render).toHaveBeenCalled();
  });

  it("quits on escape, q and ctrl-c", () => {
    const screen = {
      append: vi.fn(),
      key: vi.fn(),
      render: vi.fn(),
    } as unknown as Widgets.Screen;
    const blessed = {
      screen: vi.fn(() => screen),
      box: vi.fn(() => ({}) as Widgets.BoxElement),
    } as unknown as Blessed;

    new PatkaCLI(blessed);

    expect(screen.key).toHaveBeenCalledWith(["escape", "q", "C-c"], expect.any(Function));
  });
});
