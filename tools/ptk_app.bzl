load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:vitest/package_json.bzl", vitest_bin = "bin")
load("@npm//:@biomejs/biome/package_json.bzl", biome_bin = "bin")

def ptk_app(name, entry_point, srcs, test_srcs, npm_deps, packages, type_deps = []):
    ts_project(
        name = "lib",
        srcs = srcs,
        declaration = True,
        resolve_json_module = True,
        transpiler = "tsc",
        tsconfig = "//:tsconfig",
        deps = packages + ["//:package_json"] + type_deps + npm_deps,
    )

    js_binary(
        name = name,
        data = [":lib", "//:package_json"] + npm_deps,
        entry_point = entry_point,
        visibility = ["//visibility:public"],
    )

    vitest_bin.vitest_test(
        name = name + "_test",
        args = ["run"],
        chdir = native.package_name(),
        data = srcs + test_srcs + ["//:tsconfig_json"] +
               [package + ":test_data" for package in packages] +
               ["//:package_json", "//:node_modules/vitest"] + npm_deps,
    )

    biome_bin.biome_test(
        name = "lint",
        args = ["ci"] + ["{}/{}".format(native.package_name(), src) for src in srcs + test_srcs],
        data = srcs + test_srcs + ["//:biome_json"],
    )
