// The release's integrity: a pnpm pack of the build, extracted, against package.json's files and
// exports, its license, and its dependencies, by release.ts's releaseProblems, as it stands and in
// scratch copies with one fault each. It packs the dist/ that mise run build writes.
// Adapted from spike-html-apps-components (9a4392e): test/unit/release.test.js, its faults on the
// profile's files and with no dependency, in TypeScript.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { listFiles, releaseProblems } from "./release.ts";
import type { Manifest } from "./release.ts";

const root = join(import.meta.dirname, "../..");
const src = join(root, "src");
const scratches: string[] = [];

/** A new temporary directory, removed after the run. */
function scratchDir() {
  const scratch = mkdtempSync(join(tmpdir(), "release-"));
  scratches.push(scratch);
  return scratch;
}

/** The pack's manifest as this repository writes it: its peer and its devDependencies declared,
 * which the faults rewrite. */
interface Packed extends Manifest {
  exports: Record<string, string | Record<string, string> | null>;
  peerDependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

/** A fault: a change to a scratch copy of the pack, at dir, and to its manifest. */
type Change = (dir: string, manifest: Packed) => void;

// The pack under test: pnpm pack's tarball, extracted, its package/ directory.
let pack: string;
before(() => {
  const scratch = scratchDir();
  execFileSync("pnpm", ["pack", "--pack-destination", scratch], { cwd: root, stdio: "ignore" });
  const [tarball] = listFiles(scratch);
  execFileSync("tar", ["-xzf", join(scratch, tarball), "-C", scratch]);
  pack = join(scratch, "package");
});
after(() => {
  for (const scratch of scratches) rmSync(scratch, { recursive: true, force: true });
});

/** A scratch copy of the pack, `change` applied to it and its manifest, and its problems. */
function faulted(change: Change): string[] {
  const copy = join(scratchDir(), "package");
  cpSync(pack, copy, { recursive: true });
  const manifest: Packed = JSON.parse(readFileSync(join(copy, "package.json"), "utf8"));
  change(copy, manifest);
  writeFileSync(join(copy, "package.json"), JSON.stringify(manifest));
  return releaseProblems(copy, src);
}

const remove =
  (path: string): Change =>
  (dir) =>
    rmSync(join(dir, path));

describe("release pack", () => {
  test("the pack is package.json, README.md, LICENSE, and the build", () => {
    const built = listFiles(join(root, "dist")).map((path) => `dist/${path}`);
    assert.ok(built.length > 0, "mise run build wrote no dist/");
    assert.deepEqual(listFiles(pack), [...built, "LICENSE", "README.md", "package.json"].sort());
  });

  test("the pack is the release that files and exports declare", () => {
    assert.deepEqual(releaseProblems(pack, src), []);
  });

  test("the pack keeps the dependencies package.json declares, as written", () => {
    const packed: Manifest = JSON.parse(readFileSync(join(pack, "package.json"), "utf8"));
    const source: Manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    for (const field of ["dependencies", "peerDependencies", "devDependencies"] as const) {
      assert.deepEqual(packed[field], source[field], field);
    }
  });

  // npm prepares a git dependency that has a build script, which the tag's tree must never need.
  test("the packed manifest carries no scripts", () => {
    const packed: Manifest & { scripts?: unknown } = JSON.parse(
      readFileSync(join(pack, "package.json"), "utf8"),
    );
    assert.equal(packed.scripts, undefined);
  });

  const foundation = "@jaimestill/spike-html-apps-foundation";
  const github = "github:JaimeStill/spike-html-apps-foundation";
  const faults: Record<string, [Change, string]> = {
    "a source .css with no built copy": [
      remove("dist/noctis.css"),
      "src/noctis.css has no built dist/noctis.css",
    ],
    "a .ts module with no emitted .js": [
      remove("dist/noctis.js"),
      "src/noctis.ts has no built dist/noctis.js",
    ],
    "a .ts module with no emitted .d.ts": [
      remove("dist/noctis.d.ts"),
      "src/noctis.ts has no built dist/noctis.d.ts",
    ],
    "a stray built file": [
      (dir) => writeFileSync(join(dir, "dist/old.js"), ""),
      "dist/old.js is built from no source",
    ],
    "a stray file in the pack": [
      (dir) => writeFileSync(join(dir, "notes.md"), ""),
      "notes.md is packed but isn't the build, LICENSE, README.md, package.json",
    ],
    "a pack without its README": [remove("README.md"), "the pack has no README.md"],
    "an export at a missing file": [
      (_, copy) => (copy.exports["./gone.css"] = "./dist/gone.css"),
      'exports["./gone.css"] resolves to ./dist/gone.css, which isn\'t built',
    ],
    "an export whose other condition is missing": [
      (_, copy) =>
        (copy.exports["./noctis.js"] = { types: "./dist/noctis.ts", default: "./dist/noctis.js" }),
      'exports["./noctis.js"] resolves to ./dist/noctis.ts, which isn\'t built',
    ],
    "a built file no export reaches": [
      (_, copy) => delete copy.exports["./noctis.css"],
      "dist/noctis.css is reachable through no export",
    ],
    "a pattern export that reaches nothing": [
      (_, copy) => (copy.exports["./apps/*.js"] = "./dist/apps/*.js"),
      'exports["./apps/*.js"] reaches no built file',
    ],
    "a pack without its LICENSE": [remove("LICENSE"), "LICENSE is missing"],
    "a LICENSE that isn't Apache 2.0": [
      (dir) => writeFileSync(join(dir, "LICENSE"), "All rights reserved.\n"),
      "LICENSE isn't the Apache License 2.0",
    ],
    "a package that declares another license": [
      (_, copy) => (copy.license = "MIT"),
      "package.json declares license MIT, not Apache-2.0",
    ],
    "a build outside files": [
      (_, copy) => (copy.files = ["dist/noctis.css"]),
      "dist/noctis.js isn't under package.json's files",
    ],
    "the foundation in dependencies": [
      (_, copy) => (copy.dependencies = { [foundation]: `${github}#v0.2.0` }),
      `package.json declares ${foundation} in dependencies, not as a peer`,
    ],
    "a peer by a git spec": [
      (_, copy) => (copy.peerDependencies[foundation] = `${github}#v0.2.0`),
      `package.json declares peer ${foundation} ${github}#v0.2.0, not a caret range`,
    ],
    "a peer by a #semver: spec": [
      (_, copy) => (copy.peerDependencies[foundation] = `${github}#semver:^0.2.0`),
      `package.json declares peer ${foundation} ${github}#semver:^0.2.0, not a caret range`,
    ],
    "a peer by an exact version": [
      (_, copy) => (copy.peerDependencies[foundation] = "0.2.0"),
      `package.json declares peer ${foundation} 0.2.0, not a caret range`,
    ],
    "a peer by a tilde range": [
      (_, copy) => (copy.peerDependencies[foundation] = "~0.2.0"),
      `package.json declares peer ${foundation} ~0.2.0, not a caret range`,
    ],
    "a peer by any version": [
      (_, copy) => (copy.peerDependencies[foundation] = "*"),
      `package.json declares peer ${foundation} *, not a caret range`,
    ],
    "no peer": [
      // Packed declares the peer, which this fault alone takes away.
      (_, copy) => delete (copy as Manifest).peerDependencies,
      `package.json doesn't declare peer ${foundation}`,
    ],
    "an undeclared extra peer": [
      (_, copy) => (copy.peerDependencies.lit = "^3.3.3"),
      "package.json declares peer lit, which no release needs",
    ],
    "the devDependency by a #semver: range": [
      (_, copy) => (copy.devDependencies[foundation] = `${github}#semver:^0.2.0`),
      `package.json declares devDependency ${foundation} ${github}#semver:^0.2.0, not an exact release tag`,
    ],
    "the devDependency by a branch": [
      (_, copy) => (copy.devDependencies[foundation] = `${github}#main`),
      `package.json declares devDependency ${foundation} ${github}#main, not an exact release tag`,
    ],
    "the devDependency by a commit": [
      (_, copy) => (copy.devDependencies[foundation] = `${github}#29d16c0`),
      `package.json declares devDependency ${foundation} ${github}#29d16c0, not an exact release tag`,
    ],
    "the devDependency by its default branch": [
      (_, copy) => (copy.devDependencies[foundation] = github),
      `package.json declares devDependency ${foundation} ${github}, not an exact release tag`,
    ],
    "the devDependency from the registry": [
      (_, copy) => (copy.devDependencies[foundation] = "0.2.0"),
      `package.json declares devDependency ${foundation} 0.2.0, not an exact release tag`,
    ],
    "the devDependency by a local path": [
      (_, copy) => (copy.devDependencies[foundation] = "link:../spike-html-apps-foundation"),
      `package.json declares devDependency ${foundation} link:../spike-html-apps-foundation, not an exact release tag`,
    ],
    "the devDependency from another repository": [
      (_, copy) =>
        (copy.devDependencies[foundation] = "github:JaimeStill/spike-html-design#v0.2.0"),
      `package.json declares devDependency ${foundation} github:JaimeStill/spike-html-design#v0.2.0, not an exact release tag`,
    ],
    "the devDependency from another owner's fork": [
      (_, copy) =>
        (copy.devDependencies[foundation] = "github:fork/spike-html-apps-foundation#v0.2.0"),
      `package.json declares devDependency ${foundation} github:fork/spike-html-apps-foundation#v0.2.0, not an exact release tag`,
    ],
    "no devDependency": [
      (_, copy) => delete copy.devDependencies[foundation],
      `package.json doesn't declare devDependency ${foundation}`,
    ],
    "a runtime dependency": [
      (_, copy) => (copy.dependencies = { lit: "3.3.3" }),
      "package.json declares lit, which no release needs",
    ],
  };
  // The tags a caret range admits: its own major at 1.0.0 and above, its own minor below, and its
  // own patch below 0.1.0, each at or above the range's floor.
  const admitted: Record<string, string[]> = {
    "^0.2.0": ["v0.2.0", "v0.2.4"],
    "^0.1.0": ["v0.1.0", "v0.1.7"],
    "^0.0.3": ["v0.0.3"],
    "^1.2.0": ["v1.2.0", "v1.9.4"],
  };
  const denied: Record<string, string[]> = {
    "^0.2.0": ["v0.1.0", "v0.3.0", "v1.2.0"],
    "^0.1.0": ["v0.0.9", "v0.2.0", "v1.1.0"],
    "^0.0.3": ["v0.0.2", "v0.0.4", "v0.1.3"],
    "^1.2.0": ["v1.1.9", "v2.2.0"],
  };
  for (const [range, tags] of Object.entries(admitted)) {
    for (const tag of tags) {
      test(`a devDependency tag ${tag} passes a peer range ${range}`, () => {
        const problems = faulted((_, copy) => {
          copy.peerDependencies[foundation] = range;
          copy.devDependencies[foundation] = `${github}#${tag}`;
        });
        assert.deepEqual(problems, []);
      });
    }
  }
  for (const [range, tags] of Object.entries(denied)) {
    for (const tag of tags) {
      test(`fails on a devDependency tag ${tag} with a peer range ${range}`, () => {
        const problems = faulted((_, copy) => {
          copy.peerDependencies[foundation] = range;
          copy.devDependencies[foundation] = `${github}#${tag}`;
        });
        const problem = `package.json's devDependency ${foundation} ${github}#${tag} is outside its peer range ${range}`;
        assert.ok(problems.includes(problem), `expected: ${problem}\ngot: ${problems.join("\n")}`);
      });
    }
  }
  for (const [fault, [change, problem]] of Object.entries(faults)) {
    test(`fails on ${fault}`, () => {
      const problems = faulted(change);
      assert.ok(problems.includes(problem), `expected: ${problem}\ngot: ${problems.join("\n")}`);
    });
  }
});
