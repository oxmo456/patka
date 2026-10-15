import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const biome = createRequire(import.meta.url).resolve("@biomejs/biome/bin/biome");

const { status } = spawnSync(process.execPath, [biome, ...process.argv.slice(2)], {
  cwd: process.env.BUILD_WORKSPACE_DIRECTORY,
  stdio: "inherit",
});

process.exit(status ?? 1);
