import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const biome = createRequire(import.meta.url).resolve("@biomejs/biome/bin/biome");
const workspace = process.env.BUILD_WORKSPACE_DIRECTORY;

if (workspace === undefined) {
  console.error("//tools:format must be run with `bazel run`, not `bazel build`.");
  process.exit(1);
}

const { status } = spawnSync(process.execPath, [biome, ...process.argv.slice(2)], {
  cwd: workspace,
  stdio: "inherit",
});

process.exit(status ?? 1);
