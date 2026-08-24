export type Level = "info" | "warn" | "error";

let sink: (level: Level, message: string) => void = () => {};

export function install(target: typeof sink): void {
  sink = target;
}

export const log = {
  info: (message: string) => sink("info", message),
  warn: (message: string) => sink("warn", message),
  error: (message: string) => sink("error", message),
};
