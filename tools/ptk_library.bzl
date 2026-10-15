load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:vitest/package_json.bzl", vitest_bin = "bin")
load("@npm//:@biomejs/biome/package_json.bzl", biome_bin = "bin")

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
            args = ["run"],
            chdir = native.package_name(),
            data = srcs + test_srcs + [
                "//:tsconfig_json",
                "//:package_json",
                "//:node_modules/vitest",
                ":test_data",
            ] + npm_deps,
        )

    biome_bin.biome_test(
        name = "lint",
        args = ["ci"] + ["{}/{}".format(native.package_name(), src) for src in srcs + test_srcs],
        data = srcs + test_srcs + ["//:biome_json"],
    )
