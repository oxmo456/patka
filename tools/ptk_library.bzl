load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:vitest/package_json.bzl", vitest_bin = "bin")
load("//tools:lint.bzl", "biome_lint")

def ptk_library(name, srcs, test_srcs = [], deps = [], npm_deps = []):
    ts_project(
        name = name,
        srcs = srcs,
        declaration = True,
        resolve_json_module = True,
        transpiler = "tsc",
        tsconfig = "//:tsconfig",
        visibility = ["//visibility:public"],
        deps = ["//:package_json", "//:node_modules/@types/node"] + deps + npm_deps,
    )

    js_library(
        name = "test_data",
        srcs = srcs,
        deps = [dep + ":test_data" for dep in deps],
        visibility = ["//visibility:public"],
    )

    if test_srcs:
        vitest_bin.vitest_test(
            name = "test",
            args = ["run", "--config", "../" * (len(native.package_name().split("/")) - 1) + "vitest.config.ts"],
            chdir = native.package_name(),
            data = srcs + test_srcs + [
                "//packages:vitest_config",
                "//:tsconfig_json",
                "//:package_json",
                "//:node_modules/reflect-metadata",
                "//:node_modules/vitest",
                ":test_data",
            ] + npm_deps,
        )

    biome_lint(srcs = srcs + test_srcs)
