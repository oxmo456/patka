"""Biome linting for any package in the monorepo."""

load("@npm//:@biomejs/biome/package_json.bzl", biome_bin = "bin")

def biome_lint(name = "lint", srcs = None):
    """Declares a test that lints and format-checks the package's TypeScript sources.

    Files are passed to Biome explicitly because it skips the symlinks Bazel
    stages when it walks a directory.

    Args:
        name: name of the test target.
        srcs: sources to lint, defaulting to every .ts file in the package.
    """
    srcs = srcs if srcs != None else native.glob(["**/*.ts"])

    biome_bin.biome_test(
        name = name,
        args = ["ci"] + ["{}/{}".format(native.package_name(), src) for src in srcs],
        data = srcs + ["//:biome_json"],
    )
