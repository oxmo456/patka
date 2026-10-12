load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("//tools:lint.bzl", "biome_lint")

def ptk_package(name, srcs, test_srcs, tsconfig, visibility, deps = []):
    ts_project(
        name = name,
        srcs = srcs,
        declaration = True,
        transpiler = "tsc",
        tsconfig = tsconfig,
        visibility = visibility,
        deps = ["//:package_json"] + deps,
    )

    js_library(
        name = "test_data",
        srcs = srcs + test_srcs,
        visibility = visibility,
    )

    biome_lint(srcs = srcs + test_srcs)
