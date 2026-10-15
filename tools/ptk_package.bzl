load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:@biomejs/biome/package_json.bzl", biome_bin = "bin")

def ptk_package(name, srcs, test_srcs, visibility, deps = [], data = []):
    js_library(
        name = "data",
        srcs = data,
        types = data,
        visibility = visibility,
    )

    ts_project(
        name = name,
        srcs = srcs,
        declaration = True,
        resolve_json_module = True,
        transpiler = "tsc",
        tsconfig = "//:tsconfig",
        visibility = visibility,
        deps = ["//:package_json", ":data"] + deps,
    )

    js_library(
        name = "test_data",
        srcs = srcs + test_srcs + data,
        visibility = visibility,
    )

    biome_bin.biome_test(
        name = "lint",
        args = ["ci"] + ["{}/{}".format(native.package_name(), src) for src in srcs + test_srcs],
        data = srcs + test_srcs + ["//:biome_json"],
    )
