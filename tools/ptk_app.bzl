load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:vitest/package_json.bzl", vitest_bin = "bin")
load("//tools:lint.bzl", "biome_lint")

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

    biome_lint(srcs = srcs + test_srcs)
